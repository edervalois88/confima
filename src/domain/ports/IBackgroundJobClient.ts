/**
 * @fileoverview Interfaz para el programador de tareas en segundo plano.
 * Anillo 1: Domain Ports.
 */

export interface JobPayload {
  tenantId: string;
  guestId: string;
  weddingDate: string;
  phone: string;
}

export interface IBackgroundJobClient {
  /**
   * Programa una tarea para ejecutarse en un momento futuro relativo.
   * @param event Name del evento a disparar.
   * @param data Datos necesarios para la ejecución.
   * @param delayMs Tiempo de espera antes de la ejecución.
   */
  enqueueDelayed(event: string, data: JobPayload, delayMs: number): Promise<void>;
}
