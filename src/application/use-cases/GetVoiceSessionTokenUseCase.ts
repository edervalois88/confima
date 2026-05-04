import { IVoiceProvider, VoiceSession } from "../../domain/ports/IVoiceProvider";
import { InfrastructureCommunicationError } from "@/domain/errors/InfrastructureError";

/**
 * @fileoverview Caso de Uso para la generación de tokens WebRTC seguros.
 * Anillo 2: Aplicación.
 */

export class GetVoiceSessionTokenUseCase {
  constructor(private readonly voiceProvider: IVoiceProvider) {}

  public async execute(tenantId: string): Promise<VoiceSession> {
    // 1. Validación de Seguridad (Tenant Check)
    // En producción, aquí consultaríamos el AgentID configurado para este Tenant en la DB.
    const agentId = getRequiredEnv("RETELL_AGENT_ID");

    console.log(`[VOICE_USE_CASE] Iniciando mediación WebRTC para Tenant: ${tenantId}`);

    // 2. Solicitar Sesión al Proveedor (Anillo 4)
    const session = await this.voiceProvider.createWebRTCSession(agentId);

    // 3. Retornar credenciales efímeras al cliente
    return session;
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new InfrastructureCommunicationError(`Missing required environment variable: ${name}`, "CONFIGURATION_ERROR");
  }

  return value;
}
