import { ILLMService } from "@/application/ports/ILLMService";

/**
 * @fileoverview Servicio de evaluación "LLM-as-a-Judge".
 * Anillo 2: Aplicación.
 */

export interface EvalResult {
  score: number; // 0 a 100
  rationale: string;
  passed: boolean;
}

export class LLMJudgeService {
  constructor(private llmService: ILLMService) {}

  /**
   * Evalúa la fidelidad de la respuesta del agente contra la verdad fundamental (Ground Truth).
   */
  public async evaluateContextFidelity(
    input: string, 
    agentResponse: string, 
    groundTruth: string
  ): Promise<EvalResult> {
    const prompt = `Actúa como un Juez de Calidad de IA.
    ENTRADA DEL USUARIO: "${input}"
    RESPUESTA DEL AGENTE: "${agentResponse}"
    VERDAD FUNDAMENTAL: "${groundTruth}"

    Califica la respuesta del agente del 0 al 100 basándote en:
    1. Fidelidad: ¿Menciona todos los datos de la verdad fundamental?
    2. Precisión: ¿Inventa datos no presentes?
    3. Tono: ¿Es profesional y servicial?

    Responde en formato JSON: { "score": number, "rationale": "string" }`;

    const rawResponse = await this.llmService.processIntent(prompt, []);
    try {
      const result = JSON.parse(rawResponse);
      return {
        score: result.score,
        rationale: result.rationale,
        passed: result.score >= 95
      };
    } catch {
      return { score: 0, rationale: "Fallo en el formato del juez.", passed: false };
    }
  }
}
