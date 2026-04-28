import { InfrastructureCommunicationError } from "@/domain/errors/InfrastructureError";
export { InfrastructureCommunicationError } from "@/domain/errors/InfrastructureError";

/**
 * @fileoverview Patrón Circuit Breaker para proteger llamadas externas.
 * Anillo 4: Resiliencia de infraestructura.
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;

  constructor(
    private readonly failureThreshold: number = 3,
    private readonly cooldownMs: number = 60000
  ) {}

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new InfrastructureCommunicationError("Circuit Breaker is OPEN. Operation aborted.");
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
  }
}
