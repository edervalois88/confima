/**
 * @fileoverview Interfaz para proveedores de servicios de voz (Retell AI, etc.).
 * Anillo 1: Domain Ports.
 */

export interface VoiceSession {
  accessToken: string;
  callId: string;
}

export interface IVoiceProvider {
  /**
   * Genera un token de sesión efímero para conexión WebRTC.
   */
  createWebRTCSession(agentId: string): Promise<VoiceSession>;

  /**
   * Registra o actualiza el estado de una llamada en el proveedor.
   */
  updateCallStatus(callId: string, status: string): Promise<void>;

  /**
   * Obtiene la transcripción completa de una sesión finalizada.
   */
  getCallTranscript(callId: string): Promise<string>;
}
