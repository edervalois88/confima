import { z } from "zod";
import {
  ConversationMessage,
  ILLMService,
  LLMCommunicationError,
} from "@/application/ports/ILLMService";

const GeminiResponseSchema = z.object({
  candidates: z.array(
    z.object({
      content: z.object({
        parts: z.array(
          z.object({
            text: z.string().optional(),
          })
        ),
      }).optional(),
    })
  ).optional(),
});

export class GoogleGeminiLLMAdapter implements ILLMService {
  private readonly apiKey = process.env.GOOGLE_AI_API_KEY || "";
  private readonly model = process.env.GOOGLE_AI_MODEL || "gemini-flash-latest";
  private readonly baseUrl = process.env.GOOGLE_AI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

  public async processIntent(systemContext: string, history: ConversationMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new LLMCommunicationError("GOOGLE_AI_API_KEY no esta configurada.");
    }

    const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemContext }],
        },
        contents: this.toGeminiContents(history),
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new LLMCommunicationError(`Google Gemini respondio ${response.status}: ${detail}`);
    }

    const parsed = GeminiResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new LLMCommunicationError("Google Gemini devolvio una respuesta con formato inesperado.");
    }

    const text = parsed.data.candidates?.[0]?.content?.parts
      .map(part => part.text || "")
      .join("")
      .trim();

    return text || "No se recibio respuesta de Google Gemini.";
  }

  private toGeminiContents(history: ConversationMessage[]) {
    const contentHistory = history.filter(message => message.role !== "system");
    const safeHistory = contentHistory.length > 0
      ? contentHistory
      : [{ role: "user" as const, content: "Responde de forma breve." }];

    return safeHistory.map(message => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
  }
}
