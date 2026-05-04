'use server';

import { RetellVoiceAdapter } from "@/infrastructure/adapters/RetellVoiceAdapter";
import { GetVoiceSessionTokenUseCase } from "@/application/use-cases/GetVoiceSessionTokenUseCase";
import { VoiceSession } from "@/domain/ports/IVoiceProvider";

/**
 * @fileoverview Server Actions para la gestión de sesiones de voz.
 * Anillo 3: Presentación / Mediación WebRTC.
 */

const voiceAdapter = new RetellVoiceAdapter();
const getVoiceSessionTokenUseCase = new GetVoiceSessionTokenUseCase(voiceAdapter);

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

  try {
    const session = await getVoiceSessionTokenUseCase.execute(tenantId);
    
    console.info(`[VOICE_ACTION] Sesión WebRTC creada exitosamente (CallID: ${session.callId})`);
    
    return session;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("[VOICE_ACTION_ERROR]", message);
    throw new Error("No hemos podido establecer la conexión con el servidor de voz. Reintente en unos momentos.");
  }
}
