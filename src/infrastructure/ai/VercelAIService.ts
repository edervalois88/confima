import { ConversationMessage } from "@/application/ports/ILLMService";

/**
 * @fileoverview Adaptador para Vercel AI SDK 6 con soporte de Mocking.
 * Anillo 4: Infraestructura.
 */

export class VercelAIService {
  public async processIntent(prompt: string, messages: ConversationMessage[]): Promise<string> {
    // 1. Bypass para pruebas de estrés y ahorro de tokens
    if (process.env.MOCK_AI_MODE === 'true') {
      console.log("[MOCK_AI] Saltando llamada a LLM para ahorro de tokens.");
      if (prompt.includes('confirmamos')) return 'RSVP_CONFIRMED';
      return 'GENERAL_CHAT';
    }

    // Lógica real de Vercel AI SDK (Omitida para brevedad en simulación)
    return "AI_RESPONSE";
  }
}
