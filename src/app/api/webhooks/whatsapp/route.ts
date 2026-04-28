import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@/infrastructure/jobs/InngestClient";
import { z } from "zod";
import { RedisCacheClient } from "@/infrastructure/cache/RedisClient";
import { logger } from "@/infrastructure/telemetry/logger";

/**
 * @fileoverview Webhook Puente de Meta (WhatsApp Graph API) - Anillo 4.
 * CUMPLE MANDATOS ARQUITECTÓNICOS STAFF ENGINEER:
 * 1. Validación cruda (Raw Text) con HMAC-SHA256 (Timingsafe).
 * 2. Idempotencia basada en WAMID.
 * 3. SLA estricto: Delegación asíncrona vía Inngest y retorno < 1s.
 * 4. Fuerte Tipado (TypeScript Strict, Zod Validation, Zero "any").
 */

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "reservAItion_verif_123";
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || "meta_test_secret"; // Configurado en Meta Dev Portal

// Validamos el formato del Payload de Meta para evitar errores en Inngest
const WhatsAppPayloadSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.literal("whatsapp"),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            contacts: z.array(
              z.object({
                profile: z.object({ name: z.string() }),
                wa_id: z.string(),
              })
            ).optional(),
            messages: z.array(
              z.object({
                from: z.string(),
                id: z.string(),
                timestamp: z.string(),
                text: z.object({ body: z.string() }).optional(),
                type: z.string(),
              })
            ).optional(),
          })
        })
      )
    })
  )
});

type WhatsAppPayload = z.infer<typeof WhatsAppPayloadSchema>;

const idempotencyCache = new Set<string>();

/**
 * 1. MANDATO: Handshake GET (Meta Verification)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    logger.info("Handshake de Meta exitoso.", {
      component: "WhatsAppWebhookRoute",
      operation: "GET",
    });
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * 2. MANDATO: Ingesta de Datos POST (Zero-Trust & SLA)
 */
export async function POST(request: NextRequest) {
  try {
    // REGLA DE ARQUITECTURA 2: Extracción CRÍTICA del Raw Body
    // Evita la corrupción de bytes para validar la firma HMAC
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (!signature) {
      logger.warn("Peticion de WhatsApp rechazada: sin firma.", {
        component: "WhatsAppWebhookRoute",
        operation: "POST",
      });
      return new NextResponse("Missing Signature", { status: 401 });
    }

    // Firma Expected basada en app_secret de Meta
    const expectedSignature = `sha256=${crypto
      .createHmac("sha256", WHATSAPP_APP_SECRET)
      .update(rawBody)
      .digest("hex")}`;

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    // Validación segura contra timing attacks
    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      logger.warn("Peticion de WhatsApp rechazada: firma invalida.", {
        component: "WhatsAppWebhookRoute",
        operation: "POST",
      });
      return new NextResponse("Invalid Signature", { status: 401 });
    }

    // Parsing seguro con Zod post-verificación
    const jsonBody = JSON.parse(rawBody);
    
    // Ignorar eventos que no sean mensajes entrantes de WA
    if (!jsonBody.object) {
       return new NextResponse("OK", { status: 200 });
    }

    const payloadResult = WhatsAppPayloadSchema.safeParse(jsonBody);
    
    // Validar formato estricto
    if (!payloadResult.success) {
      // Ignoramos reportes de "delivery" y "read" silenciosamente
      return new NextResponse("OK", { status: 200 }); 
    }

    const payload = payloadResult.data;
    const message = payload.entry[0].changes[0].value.messages?.[0];
    const contact = payload.entry[0].changes[0].value.contacts?.[0];

    if (!message || !contact) {
      // Si no es un mensaje (ej. actualización de estado), retornamos SLA 200
      return new NextResponse("OK", { status: 200 });
    }

    // REGLA DE ARQUITECTURA 3: Barrera de Idempotencia (wamid)
    const wamid = message.id;

    if (await isDuplicateWebhookMessage(wamid)) {
      logger.info("Mensaje duplicado de WhatsApp descartado.", {
        component: "WhatsAppWebhookRoute",
        operation: "idempotency",
      });
      return new NextResponse("OK", { status: 200 });
    }

    // REGLA DE ARQUITECTURA 4: Despacho Asíncrono (Inngest)
    // El puerto 5433 (Postgres) y Ollama (11434) se usarán dentro del Job
    await inngest.send({
      name: "whatsapp/message.received",
      data: {
        wamid: wamid,
        phone: message.from,
        guestName: contact.profile.name,
        text: message.text?.body || "",
        timestamp: message.timestamp
      }
    });

    logger.info("Evento de WhatsApp despachado a Inngest.", {
      component: "WhatsAppWebhookRoute",
      operation: "inngest.send",
    });

    // SLA DE META: Respuesta garantizada en milisegundos
    return new NextResponse("OK", { status: 200 });

  } catch (error) {
    logger.error("Error critico procesando webhook de WhatsApp.", {
      component: "WhatsAppWebhookRoute",
      operation: "POST",
    });
    // Para Meta, si es un error nuestro devolvemos 500 para posible reintento
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function isDuplicateWebhookMessage(wamid: string): Promise<boolean> {
  if (RedisCacheClient.isConfigured()) {
    return RedisCacheClient.isDuplicate(wamid);
  }

  if (idempotencyCache.has(wamid)) {
    return true;
  }

  idempotencyCache.add(wamid);
  return false;
}
