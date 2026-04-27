import {
  ConversationMessage,
  ILLMService,
  LLMCommunicationError,
} from "@/application/ports/ILLMService";

export class FallbackLLMService implements ILLMService {
  constructor(private readonly providers: ILLMService[]) {}

  public async processIntent(systemContext: string, history: ConversationMessage[]): Promise<string> {
    const failures: string[] = [];

    for (const provider of this.providers) {
      try {
        return await provider.processIntent(systemContext, history);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        failures.push(message);
        console.warn("[LLM_FALLBACK]", message);
      }
    }

    throw new LLMCommunicationError(`Ningun proveedor LLM pudo responder: ${failures.join(" | ")}`);
  }
}
