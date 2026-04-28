import { IMessagingProvider, MessageTemplate } from "../../domain/ports/IMessagingProvider";
import { InfrastructureCommunicationError, ProviderCommunicationError } from "@/domain/errors/InfrastructureError";
import { logger } from "../telemetry/logger";
import { z } from "zod";

/**
 * @fileoverview Adaptador para Meta WhatsApp Cloud API.
 * Anillo 4: Infraestructura.
 */

interface WhatsAppApiMessageResponse {
  messages?: Array<{ id: string }>;
}

interface WhatsAppMediaLookupResponse {
  url: string;
}

const WhatsAppErrorResponseSchema = z.object({
  error: z.object({
    message: z.string().optional(),
    type: z.string().optional(),
    code: z.number().optional(),
    error_subcode: z.number().optional(),
    fbtrace_id: z.string().optional(),
  }).optional(),
});

export class WhatsAppCloudApiError extends ProviderCommunicationError {
  constructor(input: {
    status: number;
    providerCode?: number;
    providerType?: string;
    message: string;
    retryable?: boolean;
  }) {
    super(input);
    this.name = "WhatsAppCloudApiError";
    Object.setPrototypeOf(this, WhatsAppCloudApiError.prototype);
  }
}

export class WhatsAppCloudAdapter implements IMessagingProvider {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = "https://graph.facebook.com/v21.0";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  }

  /**
   * Envía un mensaje de texto plano o interactivo.
   */
  public async sendMessage(to: string, content: string | object): Promise<void> {
    const payload = typeof content === "string" 
      ? { messaging_product: "whatsapp", to, type: "text", text: { body: content } }
      : { messaging_product: "whatsapp", to, ...content };

    await this.postToWhatsApp(payload);
  }

  /**
   * Envía un mensaje basado en una plantilla preaprobada de Meta.
   */
  public async sendTemplateMessage(to: string, template: MessageTemplate): Promise<string> {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
        components: template.components
      }
    };

    const response = await this.postToWhatsApp(payload);
    return response?.messages?.[0]?.id || "";
  }


  /**
   * Descarga un archivo multimedia desde los servidores de Meta.
   */
  public async downloadMedia(mediaId: string): Promise<ArrayBuffer> {
    try {
      // 1. Obtener URL de descarga
      const response = await fetch(`${this.apiUrl}/${mediaId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (!response.ok) {
        throw new Error(`Meta media lookup failed with ${response.status}`);
      }

      const media = await response.json() as WhatsAppMediaLookupResponse;

      // 2. Descargar buffer binario
      const mediaResponse = await fetch(media.url, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (!mediaResponse.ok) {
        throw new Error(`Meta media download failed with ${mediaResponse.status}`);
      }

      return await mediaResponse.arrayBuffer();
    } catch (error) {
      console.error("[WA_DOWNLOAD_ERROR]", error);
      throw new Error("No he podido descargar el medio desde WhatsApp.");
    }
  }

  private async postToWhatsApp(payload: object): Promise<WhatsAppApiMessageResponse> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new WhatsAppCloudApiError({
          status: 401,
          message: "WhatsApp no esta configurado: falta token de acceso o phone number id.",
          retryable: false,
        });
      }

      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const metaError = parseWhatsAppError(errorBody);
        throw new WhatsAppCloudApiError({
          status: response.status,
          providerCode: metaError.code,
          providerType: metaError.type,
          message: toSafeWhatsAppErrorMessage(response.status, metaError),
          retryable: response.status >= 500 || response.status === 429,
        });
      }

      logger.info("Mensaje de WhatsApp enviado.", {
        component: "WhatsAppCloudAdapter",
        provider: "meta",
        status: response.status,
      });
      return await response.json() as WhatsAppApiMessageResponse;
    } catch (error) {
      if (error instanceof WhatsAppCloudApiError) {
        logger.warn("WhatsApp rechazo el envio.", {
          component: "WhatsAppCloudAdapter",
          provider: "meta",
          status: error.status,
          code: error.providerCode,
        });
        throw error;
      }

      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("Error no clasificado comunicando con WhatsApp.", {
        component: "WhatsAppCloudAdapter",
        provider: "meta",
      });
      throw new InfrastructureCommunicationError(`Error comunicando con WhatsApp Cloud API: ${message}`);
    }
  }
}

function parseWhatsAppError(rawBody: string): {
  message?: string;
  type?: string;
  code?: number;
  errorSubcode?: number;
} {
  try {
    const parsed = WhatsAppErrorResponseSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success || !parsed.data.error) return {};

    return {
      message: parsed.data.error.message,
      type: parsed.data.error.type,
      code: parsed.data.error.code,
      errorSubcode: parsed.data.error.error_subcode,
    };
  } catch {
    return {};
  }
}

function toSafeWhatsAppErrorMessage(
  status: number,
  metaError: { message?: string; type?: string; code?: number; errorSubcode?: number }
): string {
  if (status === 401 || metaError.code === 190) {
    return "WhatsApp rechazo el envio por autenticacion. Renueva WHATSAPP_ACCESS_TOKEN en Vercel.";
  }

  if (status === 400) {
    return "WhatsApp rechazo el envio por plantilla, idioma, variables o numero destino invalido.";
  }

  if (status === 429) {
    return "WhatsApp limito temporalmente el envio. Reduce el lote y reintenta mas tarde.";
  }

  return `WhatsApp rechazo el envio con estado ${status}.`;
}
