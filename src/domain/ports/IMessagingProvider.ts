/**
 * @fileoverview Interfaz unificada para proveedores de mensajería (WhatsApp, SMS, etc.).
 * Anillo 1: Domain Ports.
 */

export interface MessageTemplate {
  name: string;
  language: string;
  components: {
    type: string;
    parameters: Array<{ type: string; text?: string; payload?: string }>;
  }[];
}

export interface IMessagingProvider {
  /**
   * Envía un mensaje basado en una plantilla preaprobada (Meta Template).
   */
  sendTemplateMessage(to: string, template: MessageTemplate): Promise<string>;
  
  /**
   * Envía un mensaje de texto libre o interactivo (dentro de la ventana de 24h).
   */
  sendMessage(to: string, content: string | object): Promise<void>;
  
  /**
   * Descarga un archivo multimedia desde los servidores de Meta.
   */
  downloadMedia(mediaId: string): Promise<ArrayBuffer>;
}

