/**
 * @fileoverview Contrato de Dominio para Servicios Universales LLM.
 * Ubicación: src/application/ports/ILLMService.ts
 */
import { DomainError } from '@/domain/errors/DomainError';

/** Excepción lanzada al abortar secuencias de lenguaje generativo. */
export class LLMCommunicationError extends DomainError {
  constructor(message: string, cause?: unknown) {
    super(`[LLM_COMMUNICATION_ERROR] ${message}`, 'LLM_ERROR');
    this.name = 'LLMCommunicationError';
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/** Entidad universal para el historial conversacional fuertemente tipado. */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Interface de aislamiento. La Infraestructura debe cumplir esta firma. */
export interface ILLMService {
  /**
   * Ejecuta ciclos de inferencia semántica basados en contextos provistos.
   * @param systemContext - Estatutos y delimitadores del rol base.
   * @param history - Historial de memoria transcrita.
   * @returns La reflexión y acción desencadenada por la red.
   */
  processIntent(systemContext: string, history: ConversationMessage[]): Promise<string>;
}
