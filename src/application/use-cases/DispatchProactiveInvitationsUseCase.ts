import { IBackgroundJobClient } from "../../domain/ports/IBackgroundJobClient";

/**
 * @fileoverview Caso de Uso para despachar invitaciones proactivas masivas.
 * Anillo 2: Aplicación. Orquestación de trabajos en segundo plano.
 */

export class DispatchProactiveInvitationsUseCase {
  constructor(private readonly jobClient: IBackgroundJobClient) {}

  public async execute(tenantId: string, weddingDate: string): Promise<void> {
    console.log(`[DISPATCH_PROACTIVE] Iniciando despacho para Tenant \${tenantId} - Fecha: \${weddingDate}`);

    // 1. Obtener lista de invitados (Simulación - En producción vía PrismaRepository)
    const guests = [
      { id: "g1", phone: "521234567890", name: "Eder" },
      { id: "g2", phone: "521234567891", name: "Valois" }
    ];

    // 2. Encolar trabajos individuales en Inngest
    for (const guest of guests) {
      await this.jobClient.enqueueDelayed("wedding/proactive-check", {
        tenantId,
        guestId: guest.id,
        phone: guest.phone,
        weddingDate: weddingDate
      }, 0); // El delay real se maneja dentro del job con sleepUntil
    }

    console.log(`[DISPATCH_PROACTIVE] Finalizado. \${guests.length} trabajos encolados.`);
  }
}
