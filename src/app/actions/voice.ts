"use server";

import { RetellVoiceAdapter } from "@/infrastructure/adapters/RetellVoiceAdapter";
import { GetVoiceSessionTokenUseCase } from "@/application/use-cases/GetVoiceSessionTokenUseCase";

/**
 * @fileoverview Server Action para la mediación segura de sesiones de Voz WebRTC.
 * Anillo 3: Presentación / Server Actions.
 */

export async function createVoiceSessionAction(tenantId: string) {
  // Inyectamos la dependencia de infraestructura
  const adapter = new RetellVoiceAdapter();
  const useCase = new GetVoiceSessionTokenUseCase(adapter);

  try {
    const session = await useCase.execute(tenantId);
    
    return { 
      success: true, 
      accessToken: session.accessToken,
      callId: session.callId 
    };
  } catch (error: any) {
    console.error("[VOICE_ACTION_ERROR]", error.message);
    return { 
      success: false, 
      error: "No se pudo establecer el enlace de voz en tiempo real." 
    };
  }
}
