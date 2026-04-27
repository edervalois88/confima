import { IVoiceProvider, VoiceSession } from "../../domain/ports/IVoiceProvider";

/**
 * @fileoverview Adaptador para Retell AI (Voz de Ultra Baja Latencia).
 * Anillo 4: Infraestructura.
 */

export class RetellVoiceAdapter implements IVoiceProvider {
  private apiKey: string;
  private apiUrl: string = "https://api.retellai.com";

  constructor() {
    this.apiKey = process.env.RETELL_API_KEY || "";
  }

  /**
   * Crea una sesión WebRTC para el agente específico.
   * El LLM de Retell está pre-optimizado para TTFT bajo.
   */
  public async createWebRTCSession(agentId: string): Promise<VoiceSession> {
    try {
      const response = await fetch(`${this.apiUrl}/create-web-call`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ agent_id: agentId })
      });
      if (!response.ok) {
        throw new Error(`Retell create-web-call failed with ${response.status}`);
      }
      const data = await response.json() as RetellSessionResponse;

      return {
        accessToken: data.access_token,
        callId: data.call_id
      };
    } catch (error) {
      console.error("[RETELL_ADAPTER_ERROR]", error);
      const message = error instanceof Error ? error.message : "Error desconocido";
      throw new Error(`Fallo al iniciar sesion de voz WebRTC: ${message}`);
    }
  }

  public async updateCallStatus(callId: string, status: string): Promise<void> {
    // Implementación opcional según sea necesario para telemetría
    console.log(`[RETELL] Llamada ${callId} estado: ${status}`);
  }

  public async getCallTranscript(callId: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/get-call/${callId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      if (!response.ok) {
        throw new Error(`Retell get-call failed with ${response.status}`);
      }
      const data = await response.json() as RetellTranscriptResponse;
      return data.transcript || "";
    } catch (error) {
      console.error("[RETELL_TRANSCRIPT_ERROR]", error);
      return "";
    }
  }
}

interface RetellSessionResponse {
  access_token: string;
  call_id: string;
}

interface RetellTranscriptResponse {
  transcript?: string;
}
