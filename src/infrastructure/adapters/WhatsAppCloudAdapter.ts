import { IMessagingProvider, MessageTemplate } from "../../domain/ports/IMessagingProvider";

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
        throw new Error(`Meta message send failed with ${response.status}: ${errorBody}`);
      }

      console.log("[WA_ADAPTER] Mensaje enviado exitosamente.");
      return await response.json() as WhatsAppApiMessageResponse;
    } catch (error) {
      console.error("[WA_ADAPTER_ERROR]", error);
      const message = error instanceof Error ? error.message : "Error desconocido";
      throw new Error(`Error comunicando con WhatsApp Cloud API: ${message}`);
    }
  }
}
