import { z } from "zod";
import { ILLMService, ConversationMessage } from "@/application/ports/ILLMService";

/**
 * @fileoverview Adaptador para Ollama (IA Local y Gratuita).
 * Anillo 4: Infraestructura. Permite ejecutar el cerebro de reservAItion sin APIs de pago.
 */

export class LocalOllamaAdapter implements ILLMService {
  private endpoint = process.env.OLLAMA_ENDPOINT || "http://localhost:11434/api/generate";
  private model = process.env.OLLAMA_MODEL || "llama3.1";

  /**
   * Ejecuta la inferencia localmente usando Ollama.
   */
  public async processIntent(systemContext: string, history: ConversationMessage[]): Promise<string> {
    console.log(`[OLLAMA] Procesando con modelo: ${this.model}...`);

    try {
      const lastMessage = history[history.length - 1]?.content || "";
      const prompt = `${systemContext}\n\nUsuario: ${lastMessage}`;

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
        }),
      });

      const data = OllamaGenerateResponseSchema.parse(await response.json());
      return data.response || "No se recibio respuesta del modelo local.";
    } catch (error) {
      console.error("[OLLAMA_ERROR] Asegurate de que Ollama este corriendo (ollama serve)");
      return "Error: No se pudo conectar con el modelo local.";
    }
  }

  public async callTool(toolName: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log(`[OLLAMA_TOOL] Ejecutando herramienta local: ${toolName}`, params);
    return { success: true, message: "Simulado localmente" };
  }
}

const OllamaGenerateResponseSchema = z.object({
  response: z.string().optional(),
});
