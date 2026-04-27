import { ILLMService } from "@/application/ports/ILLMService";
import { FallbackLLMService } from "@/application/services/FallbackLLMService";
import { GoogleGeminiLLMAdapter } from "@/infrastructure/ai/GoogleGeminiLLMAdapter";
import { GroqLLMAdapter } from "@/infrastructure/ai/GroqLLMAdapter";
import { LocalOllamaAdapter } from "@/infrastructure/ai/LocalOllamaAdapter";

/**
 * @fileoverview Fábrica de Proveedores de LLM.
 * Decide entre local (Ollama) o nube basado en variables de entorno.
 */

export class LLMProviderFactory {
  public static getProvider(): ILLMService {
    const useLocal = process.env.USE_LOCAL_AI === "true";
    const provider = (process.env.LLM_PROVIDER || "auto").toLowerCase();
    
    if (useLocal || provider === "ollama" || provider === "local") {
      console.log("[LLM_FACTORY] Usando IA Local (Ollama)");
      return new LocalOllamaAdapter();
    }

    if (provider === "groq") {
      console.log("[LLM_FACTORY] Usando Groq");
      return new GroqLLMAdapter();
    }

    if (provider === "google" || provider === "gemini") {
      console.log("[LLM_FACTORY] Usando Google Gemini");
      return new GoogleGeminiLLMAdapter();
    }

    console.log("[LLM_FACTORY] Usando fallback Groq -> Google Gemini -> Ollama");
    return new FallbackLLMService([
      new GroqLLMAdapter(),
      new GoogleGeminiLLMAdapter(),
      new LocalOllamaAdapter(),
    ]);
  }
}
