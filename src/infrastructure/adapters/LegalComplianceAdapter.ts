import { ILegalComplianceService, LegalRisk } from "../../domain/ports/PlanningPorts";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

/**
 * @fileoverview Adaptador de cumplimiento legal con Salidas Estructuradas.
 * Anillo 4: Infraestructura.
 */

export class LegalComplianceAdapter implements ILegalComplianceService {
  private model = openai("gpt-4o");

  public async auditVendorContract(contractText: string): Promise<LegalRisk[]> {
    console.log("[LEGAL_ADAPTER] Iniciando auditoría determinista de contrato.");

    try {
      const { object } = await generateObject({
        model: this.model,
        schema: z.object({
          risks: z.array(z.object({
            type: z.string().describe("Categoría del riesgo (ej: Retainer, Cancellation, Liability)"),
            severity: z.enum(["low", "medium", "high"]),
            description: z.string().describe("Breve explicación de la cláusula problemática."),
            mitigationSuggestion: z.string().describe("Recomendación para negociar o mitigar el riesgo.")
          }))
        }),
        system: `Eres un experto legal especializado en el sector de bodas y eventos. 
        Tu tarea es auditar el contrato proporcionado siguiendo este SOP:
        1. RETENCIONES: Bandera roja si > 50%.
        2. CANCELACIONES: Verificar si hay cronogramas de reembolso claros.
        3. RESPONSABILIDAD: Detectar cláusulas que transfieran riesgos extremos al cliente.
        Solo devuelve riesgos reales y fundamentados.`,
        prompt: `Analiza este contrato: \n\n \${contractText}`
      });

      return object.risks;
    } catch (error) {
      console.error("[LEGAL_ADAPTER_ERROR]", error);
      // Degradación elegante: Lanzar error de dominio para disparar Human Handoff
      throw new Error("No se pudo analizar el contrato de forma estructurada. Requiere revisión manual.");
    }
  }
}
