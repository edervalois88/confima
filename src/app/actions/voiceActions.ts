'use server';

import { RetellVoiceAdapter } from "@/infrastructure/adapters/RetellVoiceAdapter";
import { VoiceSession } from "@/domain/ports/IVoiceProvider";

/**
 * @fileoverview Server Actions para la gestión de sesiones de voz.
 * Anillo 3: Presentación / Mediación WebRTC.
 */

const voiceAdapter = new RetellVoiceAdapter();

/**
 * Obtiene un token efímero para iniciar una llamada WebRTC con el conserje.
 * Implementa la arquitectura mediada por seguridad.
 */
export async function getVoiceSessionToken(tenantId: string): Promise<VoiceSession> {
  console.log(`[VOICE_ACTION] Solicitando token de voz para Tenant: ${tenantId}`);
  
  // 1. Validación de Sesión y Feature Flags (Simulación)
  // En producción utilizaríamos auth() de NextAuth y consultoría a Prisma
  const hasVoiceAccess = true; // tenant.features.hasVoiceChannel
  if (!hasVoiceAccess) {
    throw new Error("Su plan actual no incluye el canal de voz de ultra baja latencia.");
  }

  // 2. Selección del Agente de Retell según el Tenant
  // Cada tenant podría tener un agente con voz y personalidad personalizada
  const agentId = process.env.RETELL_AGENT_ID || "agent_demo_123";

  // 3. Crear sesión WebRTC mediante el adaptador de infraestructura
  try {
    const session = await voiceAdapter.createWebRTCSession(agentId);
    
    // 4. Registro de auditoría
    console.info(`[VOICE_ACTION] Sesión WebRTC creada exitosamente (CallID: ${session.callId})`);
    
    return session;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("[VOICE_ACTION_ERROR]", message);
    throw new Error("No hemos podido establecer la conexión con el servidor de voz. Reintente en unos momentos.");
  }
}
