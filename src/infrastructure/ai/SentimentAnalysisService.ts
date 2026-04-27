import { ISentimentAnalysisService, SentimentResult } from "../../domain/ports/PlanningPorts";
import { VercelAIService } from "./VercelAIService";

/**
 * @fileoverview Servicio de Análisis Semántico de Sentimiento.
 * Anillo 4: Infraestructura. Utiliza LLM para estructurar feedback.
 */

export class SentimentAnalysisService implements ISentimentAnalysisService {
  constructor(private readonly aiService: VercelAIService) {}

  public async analyze(text: string): Promise<SentimentResult> {
    console.log(`[SENTIMENT_SERVICE] Analizando feedback: \${text.substring(0, 30)}...`);

    // Prompt de extracción estructurada (Few-Shot Prompting)
    const prompt = `Analiza el siguiente comentario de un invitado de boda y devuelve un JSON con:
    - sentiment: POSITIVE | NEGATIVE | NEUTRAL
    - score: número del 0 al 1
    - category: CATERING | MUSIC | WEATHER | LOGISTICS | OTHER
    - evidence: una oración que justifique la categoría.
    
    Texto: "\${text}"`;

    // Simulación de respuesta estructurada (En producción usaríamos response_format: { type: 'json_object' })
    return {
      sentiment: text.toLowerCase().includes("malo") || text.toLowerCase().includes("pesimo") ? "NEGATIVE" : "POSITIVE",
      score: 0.85,
      category: text.toLowerCase().includes("comida") ? "CATERING" : "LOGISTICS",
      evidence: "El invitado menciona específicamente la calidad del servicio."
    };
  }
}
