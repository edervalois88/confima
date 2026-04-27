import { CircuitBreaker, InfrastructureCommunicationError } from './CircuitBreakers';

/**
 * @fileoverview Adaptador para APIs corporativas externas (ej. OpenTable).
 * Anillo 4: Integración con Circuit Breaker y Degradación Elegante.
 */

export class CorporativeApiSafeguardAdapter {
  private breaker: CircuitBreaker;

  constructor() {
    this.breaker = new CircuitBreaker();
  }

  /**
   * Envía una reserva a un sistema externo con protección de fallo.
   */
  public async syncReservation(payload: unknown): Promise<boolean> {
    try {
      return await this.breaker.execute(async () => {
        // Simulación de llamada REST real
        const response = await fetch('https://api.opentable.com/v1/sync', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new InfrastructureCommunicationError(`HTTP Error: ${response.status}`);
        }

        return true;
      });
    } catch (error) {
      console.warn("[SAFEGUARD] Falló sincronización externa. Activando Degradación Elegante.", error);
      // Aquí se dispararía el envío de SMS o colas asíncronas
      return false;
    }
  }
}
