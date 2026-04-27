import { z } from "zod";
import {
  ConversationMessage,
  ILLMService,
  LLMCommunicationError,
} from "@/application/ports/ILLMService";

const GroqChatCompletionSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable().optional(),
      }),
    })
  ),
});

export class GroqLLMAdapter implements ILLMService {
  private readonly endpoint = process.env.GROQ_API_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions";
  private readonly apiKey = process.env.GROQ_API_KEY || "";
  private readonly model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  public async processIntent(systemContext: string, history: ConversationMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new LLMCommunicationError("GROQ_API_KEY no esta configurada.");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemContext },
          ...history.map(message => ({
            role: message.role,
            content: message.content,
          })),
        ],
        temperature: 0.2,
        max_completion_tokens: 512,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new LLMCommunicationError(`Groq respondio ${response.status}: ${detail}`);
    }

    const parsed = GroqChatCompletionSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new LLMCommunicationError("Groq devolvio una respuesta con formato inesperado.");
    }

    return parsed.data.choices[0]?.message.content?.trim() || "No se recibio respuesta de Groq.";
  }
}
