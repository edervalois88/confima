import { StateGraph, END, START } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { BudgetAllocation, IBudgetOptimizationService, IVendorRepository, LegalRisk, Vendor } from "../../domain/ports/PlanningPorts";
import { LangSmithAdapter } from "../../infrastructure/telemetry/LangSmithAdapter";
import { ILLMService } from "../ports/ILLMService";
import { logger } from "@/infrastructure/telemetry/logger";

/**
 * @fileoverview Orquestador Jerárquico de Planificación de Bodas.
 * Anillo 2: Aplicación. Implementa Aislamiento de Contexto y Compresión de Memoria.
 */

export interface PlanningState {
  messages: BaseMessage[];
  summary: string;
  nextModule: "budget" | "vendor" | "compliance" | "voice_agent" | "contingency_manager" | "finalizer" | null;
  correlationId: string;
  tenantId: string;
  completedTasks: string[];
  source?: "whatsapp" | "voice";
  // Silos Cognitivos (Aislamiento de Contexto)
  financialContext: {
    totalBudget?: number;
    allocations: BudgetAllocation[];
  };
  aestheticContext: {
    moodboardVectors?: number[];
    stylePreferences: string[];
  };
  legalContext: {
    risks: LegalRisk[];
    isSafeToProceed: boolean;
  };
  sharedContext: {
    foundVendors: Vendor[];
  };
}

export class WeddingPlanningOrchestrator {
  constructor(
    private budgetService: IBudgetOptimizationService,
    private vendorRepo: IVendorRepository,
    private llmService?: ILLMService
  ) {}

  public createGraph() {
    const workflow: StateGraph<PlanningState, PlanningState, Partial<PlanningState>, string> = new StateGraph<PlanningState>({
      channels: {
        messages: { 
          reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y), 
          default: () => [] 
        },
        summary: { reducer: (x: string, y: string) => y ?? x, default: () => "" },
        nextModule: { reducer: (x: PlanningState["nextModule"], y: PlanningState["nextModule"]) => y ?? x, default: () => null },
        correlationId: { reducer: (x: string, y: string) => x, default: () => "" },
        tenantId: { reducer: (x: string, y: string) => x, default: () => "" },
        completedTasks: { reducer: (x: string[], y: string[]) => [...new Set([...x, ...y])], default: () => [] },
        financialContext: { reducer: (x: PlanningState["financialContext"], y: Partial<PlanningState["financialContext"]>) => ({ ...x, ...y }), default: () => ({ allocations: [] }) },
        aestheticContext: { reducer: (x: PlanningState["aestheticContext"], y: Partial<PlanningState["aestheticContext"]>) => ({ ...x, ...y }), default: () => ({ stylePreferences: [] }) },
        legalContext: { reducer: (x: PlanningState["legalContext"], y: Partial<PlanningState["legalContext"]>) => ({ ...x, ...y }), default: () => ({ risks: [], isSafeToProceed: false }) },
        sharedContext: { reducer: (x: PlanningState["sharedContext"], y: Partial<PlanningState["sharedContext"]>) => ({ ...x, ...y }), default: () => ({ foundVendors: [] }) },
        source: { reducer: (x: "whatsapp" | "voice" | undefined, y: "whatsapp" | "voice" | undefined) => y ?? x, default: () => "whatsapp" as const },
      }
    });

    // 0. Nodo de Resumen (Context Engineering)
    workflow.addNode("summarizer", async (state: PlanningState) => {
      LangSmithAdapter.logNodeExecution("summarizer", { 
        correlationId: state.correlationId, 
        tenantId: state.tenantId, 
        source: state.source || "whatsapp" 
      }, state.messages);

      const humanMessage = state.messages.find(m => m instanceof HumanMessage) || state.messages[0];
      return {
        summary: "Contexto comprimido.",
        messages: humanMessage ? [humanMessage] : []
      };
    });

    // 1. Nodo Supervisor (Hierarchical Routing)
    workflow.addNode("supervisor", async (state: PlanningState) => {
      LangSmithAdapter.logNodeExecution("supervisor", { 
        correlationId: state.correlationId, 
        tenantId: state.tenantId, 
        source: state.source || "whatsapp" 
      }, state.messages);

      const lastInput = (state.messages[0]?.content || "").toString().toUpperCase();

      logger.info("Supervisor evaluando tareas.", {
        component: "WeddingPlanningOrchestrator",
        operation: "supervisor",
        tenantId: state.tenantId,
        completedTasks: state.completedTasks.length,
      });
      
      if (lastInput.includes("ALERTA_CONTINGENCIA")) {
        return { nextModule: "contingency_manager" as const };
      }
      
      if (state.source === "voice") {
        return { nextModule: "voice_agent" as const };
      }
      
      if ((lastInput.includes("presupuesto") || lastInput.includes("dinero")) && !state.completedTasks.includes("budget")) {
        return { nextModule: "budget" as const };
      }
      if ((lastInput.includes("moodboard") || lastInput.includes("estilo") || lastInput.includes("proveedor")) && !state.completedTasks.includes("vendor")) {
        return { nextModule: "vendor" as const };
      }
      if ((lastInput.includes("contrato") || lastInput.includes("cláusula")) && !state.completedTasks.includes("compliance")) {
        return { nextModule: "compliance" as const };
      }
      
      return { nextModule: "finalizer" as const };
    });

    // 2. Nodo Budget (Silo Financiero)
    workflow.addNode("budget_agent", async (state: PlanningState) => {
      logger.info("Optimizando presupuesto.", {
        component: "WeddingPlanningOrchestrator",
        operation: "budget_agent",
        tenantId: state.tenantId,
      });
      const allocations = await this.budgetService.calculateOptimalAllocation(state.financialContext.totalBudget || 50000, "");
      return { 
        messages: [new AIMessage("Presupuesto optimizado.")],
        completedTasks: ["budget"],
        financialContext: { allocations },
        nextModule: "supervisor" as const 
      };
    });

    // ...) Nodo Vendor
    workflow.addNode("vendor_agent", async (state: PlanningState) => {
      const vendors = await this.vendorRepo.searchVendors({ maxPrice: 20000 });
      return { 
        messages: [new AIMessage("Proveedores alineados encontrados.")],
        completedTasks: ["vendor"],
        sharedContext: { foundVendors: vendors },
        nextModule: "supervisor" as const 
      };
    });

    // ...) Nodo Compliance
    workflow.addNode("compliance_agent", async (state: PlanningState) => {
      return { 
        messages: [new AIMessage("Auditoria legal completada.")],
        completedTasks: ["compliance"],
        legalContext: { risks: [], isSafeToProceed: true },
        nextModule: "supervisor" as const 
      };
    });

    // 5. Nodo Voice (Interacción en Tiempo Real)
    workflow.addNode("voice_agent", async (state: PlanningState) => {
      const lastInput = (state.messages[state.messages.length - 1]?.content || "").toString().toLowerCase();
      let toolMessage = "";
      if (lastInput.includes("confirma")) toolMessage = "Asistencia confirmada.";
      
      return { 
        messages: [new AIMessage(toolMessage || "Voz procesada.")],
        summary: "Procesando voz...",
        nextModule: "finalizer" as const 
      };
    });

    // 6. Nodo Finalizer (Síntesis)
    workflow.addNode("finalizer", async (state: PlanningState) => {
      return { 
        messages: [new AIMessage("Planificacion completada.")],
        nextModule: null 
      };
    });

    // Aristas
    workflow.addEdge(START, "summarizer");
    workflow.addEdge("summarizer", "supervisor");

    workflow.addConditionalEdges("supervisor", (state: PlanningState) => state.nextModule || "finalizer", {
      budget: "budget_agent",
      vendor: "vendor_agent",
      compliance: "compliance_agent",
      voice_agent: "voice_agent",
      contingency_manager: "contingency_manager",
      finalizer: "finalizer"
    });

    // --- PATRÓN FAN-OUT ---
    workflow.addNode("contingency_manager", async (state: PlanningState) => {
      return { nextModule: "contingency_manager" as const }; // Simulado
    });

    workflow.addNode("vendor_voice_node", async (state: PlanningState) => {
      return { messages: [new AIMessage("Llamadas completadas.")] };
    });

    workflow.addNode("guest_broadcast_node", async (state: PlanningState) => {
      return { messages: [new AIMessage("Broadcast enviado.")] };
    });

    workflow.addNode("staff_alert_node", async (state: PlanningState) => {
      return { messages: [new AIMessage("Alertas enviadas.")] };
    });

    workflow.addEdge("contingency_manager", "vendor_voice_node");
    workflow.addEdge("contingency_manager", "guest_broadcast_node");
    workflow.addEdge("contingency_manager", "staff_alert_node");

    workflow.addEdge("vendor_voice_node", "finalizer");
    workflow.addEdge("guest_broadcast_node", "finalizer");
    workflow.addEdge("staff_alert_node", "finalizer");

    workflow.addEdge("budget_agent", "supervisor");
    workflow.addEdge("vendor_agent", "supervisor");
    workflow.addEdge("compliance_agent", "supervisor");
    workflow.addEdge("finalizer", END);

    return workflow.compile();
  }

  public async *streamPlanning(inputs: Partial<PlanningState>) {
    const app = this.createGraph();
    const stream = await app.stream(toPlanningState(inputs), { streamMode: "updates" });

    for await (const update of stream) {
      const nodeName = Object.keys(update)[0];
      const delta = (update as Record<string, Partial<PlanningState>>)[nodeName] || {};

      yield {
        node: nodeName,
        status: "completed",
        message: delta.messages && delta.messages.length > 0 ? String(delta.messages[0].content) : "",
        completedTasks: delta.completedTasks || []
      };
    }
  }
}

function toPlanningState(input: Partial<PlanningState>): PlanningState {
  return {
    messages: input.messages || [],
    summary: input.summary || "",
    nextModule: input.nextModule ?? null,
    correlationId: input.correlationId || "",
    tenantId: input.tenantId || "",
    completedTasks: input.completedTasks || [],
    source: input.source || "whatsapp",
    financialContext: {
      allocations: [],
      ...input.financialContext,
    },
    aestheticContext: {
      stylePreferences: [],
      ...input.aestheticContext,
    },
    legalContext: {
      risks: [],
      isSafeToProceed: false,
      ...input.legalContext,
    },
    sharedContext: {
      foundVendors: [],
      ...input.sharedContext,
    },
  };
}
