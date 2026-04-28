import { WeddingPlanningOrchestrator } from "./WeddingPlanningOrchestrator";
import { SystemMessage } from "@langchain/core/messages";
import { logger } from "@/infrastructure/telemetry/logger";

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
    logger.info("Iniciando orquestacion de contingencia.", {
      component: "HandleExternalContingencyUseCase",
      operation: "execute",
      tenantId: input.tenantId,
      contingencyType: input.contingencyType,
      severity: input.severity,
    });

    // Inyectamos el evento de contingencia en el flujo de LangGraph
    // El orquestador detectará el prefijo ALERTA_CONTINGENCIA y activará el contingency_node
    const stream = this.orchestrator.streamPlanning({
      messages: [new SystemMessage(`ALERTA_CONTINGENCIA: ${input.description}`)],
      tenantId: input.tenantId,
      correlationId: `CRISIS_${Date.now()}`,
      source: "whatsapp" 
    });

    for await (const event of stream) {
      logger.info("Progreso de contingencia.", {
        component: "HandleExternalContingencyUseCase",
        operation: "streamPlanning",
        tenantId: input.tenantId,
        node: event.node,
        status: event.status,
      });
    }
  }
}
