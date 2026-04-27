import { WeddingPlanningOrchestrator } from "../use-cases/WeddingPlanningOrchestrator";
import { IMessagingProvider } from "../../domain/ports/IMessagingProvider";
import { IDocumentExtractionService } from "../../domain/ports/PlanningPorts";
import { HumanMessage } from "@langchain/core/messages";
import { WhatsAppWebhookSchema } from "../../infrastructure/schemas/WhatsAppSchemas";
import { RedisCacheClient } from "../../infrastructure/cache/RedisClient";

/**
 * @fileoverview Orquestador asíncrono para eventos de WhatsApp Multimodales.
 * Anillo 2: Aplicación.
 */

export class WhatsAppWebhookHandler {
  constructor(
    private orchestrator: WeddingPlanningOrchestrator,
    private messagingProvider: IMessagingProvider,
    private docService: IDocumentExtractionService
  ) {}

  /**
   * Procesa la carga útil multimodal recibida de Meta (Texto / Imagen / Documento / Interactivos).
   */
  public async handleWebhookEvent(rawPayload: any) {
    // 1. Validación Estricta con Zod
    const validation = WhatsAppWebhookSchema.safeParse(rawPayload);
    if (!validation.success) {
      console.error("[WA_WEBHOOK_VALIDATION_ERROR]", validation.error.format());
      return;
    }

    const value = validation.data.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return;

    const from = message.from;
    const messageId = message.id;
    let content = "";

    // 2. Control de Idempotencia (Redis)
    const isDuplicate = await RedisCacheClient.isDuplicate(messageId);
    if (isDuplicate) {
      console.warn(`[WA_WEBHOOK] Mensaje duplicado detectado (MsgID: \${messageId}). Ignorando.`);
      return;
    }

    try {
      // 3. Ingesta Multimodal y Postbacks
      if (message.type === "text" && message.text) {
        content = message.text.body;
      } else if (message.type === "interactive" && message.interactive) {
        const interactive = message.interactive;
        if (interactive.type === "button_reply") {
          const payload = interactive.button_reply?.payload;
          const title = interactive.button_reply?.title;
          
          // Re-enganche Cognitivo: Traducimos el postback a contexto semántico
          content = `[POSTBACK_INTERACTIVO] El invitado ha seleccionado: "\${title}" (ID de acción: \${payload})`;
          console.log(`[WA_HANDLER] Postback interactivo interceptado: \${payload}`);
        }
      } else if (message.type === "image") {
        content = "[MODO_MULTIMODAL] Se ha recibido una imagen para el moodboard.";
      } else if (message.type === "document" && message.document) {
        console.log(`[WA_HANDLER] Documento detectado (ID: \${message.document.id}). Iniciando descarga...`);
        const buffer = await this.messagingProvider.downloadMedia(message.document.id);
        content = await this.docService.extractTextFromBuffer(buffer, message.document.mime_type);
        console.log(`[WA_HANDLER] Contenido del documento extraído para auditoría.`);
      }

      console.log(`[WA_HANDLER] Procesando intención de \${from} (MsgID: \${messageId})`);

      // 4. Invocar Cerebro Multi-Agente (LangGraph)
      const stream = this.orchestrator.streamPlanning({
        messages: [new HumanMessage(content)],
        tenantId: "WHATSAPP_USER",
        correlationId: `WA_\${messageId}`
      });

      let lastMessage = "Lo siento, estoy procesando tu solicitud.";
      for await (const event of stream) {
        if (event.node === "finalizer") {
          lastMessage = event.message;
        }
      }

      // 5. Responder al usuario
      await this.messagingProvider.sendMessage(from, lastMessage);
    } catch (error: any) {
      console.error("[WA_HANDLER_ERROR]", error);
      const errorMessage = error.message?.includes("PDF") 
        ? "No he podido leer este documento. Por favor, asegúrate de que sea un PDF sin contraseña."
        : "Hubo un error procesando tu solicitud legal o financiera.";
      
      await this.messagingProvider.sendMessage(from, errorMessage);
    }
  }
}

