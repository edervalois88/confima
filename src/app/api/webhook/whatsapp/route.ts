import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { inngest } from "@/infrastructure/jobs/InngestClient";
import { RedisCacheClient } from "@/infrastructure/cache/RedisClient";
import { logger } from "@/infrastructure/telemetry/logger";

const WhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        metadata: z.object({
          display_phone_number: z.string().optional(),
          phone_number_id: z.string(),
        }),
        contacts: z.array(z.object({
          profile: z.object({ name: z.string() }),
          wa_id: z.string(),
        })).optional(),
        messages: z.array(z.object({
          id: z.string(),
          from: z.string(),
          timestamp: z.string().optional(),
          text: z.object({ body: z.string() }).optional(),
          type: z.string(),
        })).optional(),
      }),
      field: z.string().optional(),
    })),
  })),
});

const memoryIdempotencyCache = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (!validateMetaSignature(rawBody, signature)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = WhatsAppWebhookSchema.safeParse(JSON.parse(rawBody));
    if (!payload.success) {
      return NextResponse.json({ status: "received" });
    }

    const entry = payload.data.entry[0];
    const value = entry?.changes[0]?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message || !contact) {
      return NextResponse.json({ status: "received" });
    }

    if (await isDuplicateWebhookMessage(message.id)) {
      logger.info("Mensaje duplicado descartado en ruta legacy.", {
        component: "WhatsAppLegacyWebhookRoute",
        operation: "idempotency",
      });
      return NextResponse.json({ status: "received" });
    }

    await inngest.send({
      name: "whatsapp/message.received",
      data: {
        wamid: message.id,
        phone: message.from,
        guestName: contact.profile.name,
        text: message.text?.body || "",
        timestamp: message.timestamp || `${Date.now()}`,
        wabaId: entry.id,
        phoneNumberId: value.metadata.phone_number_id,
      },
    });

    return NextResponse.json({ status: "received" });
  } catch (error) {
    logger.error("Error procesando webhook legacy de WhatsApp.", {
      component: "WhatsAppLegacyWebhookRoute",
      operation: "POST",
      errorMessage: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ status: "received" }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

function validateMetaSignature(body: string, signature: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!signature || !appSecret) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(body).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

async function isDuplicateWebhookMessage(wamid: string): Promise<boolean> {
  if (RedisCacheClient.isConfigured()) {
    return RedisCacheClient.isDuplicate(wamid);
  }

  if (memoryIdempotencyCache.has(wamid)) return true;
  memoryIdempotencyCache.add(wamid);
  return false;
}
