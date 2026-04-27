import { Inngest } from "inngest";
import { IBackgroundJobClient, JobPayload } from "../../domain/ports/IBackgroundJobClient";

/**
 * @fileoverview Adaptador de Inngest para trabajos en segundo plano.
 * Anillo 4: Infrastructure.
 */

export const inngest = new Inngest({ id: "reservAItion-app" });

export class InngestJobClient implements IBackgroundJobClient {
  public async enqueueDelayed(
    event: string, 
    data: JobPayload, 
    delayMs: number
  ): Promise<void> {
    console.info(`[INNGEST] Encolando evento '${event}' para Tenant ${data.tenantId} con delay de ${delayMs}ms`);
    
    await inngest.send({
      name: event,
      data: data,
    });
  }
}
