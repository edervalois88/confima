import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHmac } from 'crypto';
import { TenantResolutionService } from '@/application/services/TenantResolutionService';
import { WhatsAppWebhookHandler } from '@/application/services/WhatsAppWebhookHandler';
import { WeddingPlanningOrchestrator } from '@/application/use-cases/WeddingPlanningOrchestrator';
import { WhatsAppCloudAdapter } from '@/infrastructure/adapters/WhatsAppCloudAdapter';
import { PdfParserAdapter } from '@/infrastructure/adapters/PdfParserAdapter';



/**
 * @fileoverview Webhook para WhatsApp Business Cloud API.
 * Anillo 4: Adaptador SaaS con Protección Redis y Firma Meta.
 */

const WhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messages: z.array(z.object({
          id: z.string(),
          from: z.string(),
          text: z.object({ body: z.string() }).optional(),
          image: z.object({ id: z.string(), mime_type: z.string() }).optional(),
          document: z.object({ id: z.string(), mime_type: z.string(), filename: z.string().optional() }).optional(),
          type: z.string()
        })).optional()

      }),
      field: z.string()
    }))
  }))
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 1. Validación de Firma de Meta (SHA-256)
    if (!validateMetaSignature(rawBody, signature)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const payload = WhatsAppWebhookSchema.safeParse(body);
    if (!payload.success) return NextResponse.json({ status: 'received' });

    // 2. Extracción de Metadatos Críticos
    const entry = payload.data.entry[0];
    const wabaId = entry.id;
    const messages = entry.changes[0].value.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'received' });
    }

    const currentMsg = messages[0];

    // 3. Resolución de Tenant (Redis Cache-Aside) e Idempotencia
    const [tenantCtx, isDuplicate] = await Promise.all([
      TenantResolutionService.resolveByWabaId(wabaId),
      TenantResolutionService.isMessageDuplicate(currentMsg.id)
    ]);

    if (isDuplicate) {
      console.info(`[REDIS_IDEMPOTENCY] Msg ${currentMsg.id} descartado.`);
      return NextResponse.json({ status: 'received' });
    }

    if (!tenantCtx) {
      console.warn(`[MULTI-TENANT] Contexto no resuelto para WABA ${wabaId}`);
      return NextResponse.json({ status: 'received' });
    }

    // 4. Procesamiento Asíncrono (Offloading)
    const handler = new WhatsAppWebhookHandler(
      new WeddingPlanningOrchestrator(
        {} as any, 
        {} as any 
      ),
      new WhatsAppCloudAdapter(),
      new PdfParserAdapter()
    );

    handler.handleWebhookEvent(body).catch((err: any) => {
      console.error("[WA_ASYNC_ERROR]", err);
    });


    return NextResponse.json({ status: 'received' });

  } catch (err) {
    console.error("[WHATSAPP_FATAL_ERROR]", err);
    return NextResponse.json({ error: 'Internal logging' }, { status: 200 });
  }
}

// ... rest of the file


function validateMetaSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = createHmac('sha256', process.env.WHATSAPP_APP_SECRET || '')
    .update(body)
    .digest('hex');
  return `sha256=${hash}` === signature;
}

function processAsyncMessage(from: string, text: string, tenantId: string) {
  // Lógica asíncrona hacia LangGraph
  console.info(`[OFFLOADING] Desviando mensaje a LangGraph para Tenant ${tenantId}`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}
