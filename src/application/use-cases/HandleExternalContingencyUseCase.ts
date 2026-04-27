import { WeddingPlanningOrchestrator } from "./WeddingPlanningOrchestrator";

/**
 * @fileoverview Caso de Uso para manejar contingencias externas (Clima, Proveedores).
 * Anillo 2: Aplicación.
 */

export interface ContingencyInput {
  tenantId: string;
  contingencyType: "WEATHER" | "VENDOR_DELAY" | "LOGISTICS_ISSUE";
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
}

export class HandleExternalContingencyUseCase {
  constructor(private readonly orchestrator: WeddingPlanningOrchestrator) {}

  public async execute(input: ContingencyInput) {
    console.log(`[CONTINGENCY_USE_CASE] Iniciando orquestación Fan-Out para: \${input.contingencyType}`);

    // Inyectamos el evento de contingencia en el flujo de LangGraph
    // El orquestador detectará el prefijo ALERTA_CONTINGENCIA y activará el contingency_node
    const stream = this.orchestrator.streamPlanning({
      messages: [{ role: "system", content: `ALERTA_CONTINGENCIA: \${input.description}` } as any],
      tenantId: input.tenantId,
      correlationId: `CRISIS_\${Date.now()}`,
      source: "whatsapp" 
    });

    for await (const event of stream) {
      console.log(`[CONTINGENCY_PROGRESS] \${event.node}: \${event.status}`);
    }
  }
}
