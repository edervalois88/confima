import { WeddingPlanningOrchestrator } from "../../application/use-cases/WeddingPlanningOrchestrator";

import { HumanMessage } from "@langchain/core/messages";

/**
 * @fileoverview Script de prueba para el Flujo Final de Integración (Multimodal).
 * Valida: Orquestación, Trazabilidad y Aislamiento de Contexto.
 */

async function runFinalSimulation() {
  console.log("=== INICIANDO SIMULACIÓN DE FLUJO FINAL (MULTIMODAL) ===");

  // Inyección de dependencias (Mocks de infraestructura con lógica de negocio)
  const budgetService = {
    calculateOptimalAllocation: async (total: number) => [
      { category: "Banquete", allocated: total * 0.5, spent: 0 },
      { category: "Flores", allocated: total * 0.15, spent: 0 }
    ],
    updateAllocation: async () => {}
  };

  const vendorRepo = {
    searchVendors: async () => [
      { id: "v1", name: "Hacienda El Rosal", category: "Lugar", priceRange: "$$$", rating: 5, aestheticScore: 0.95 }
    ],
    getContractText: async () => "Contrato: Depósito del 60% inicial. Sin política de lluvia."
  };

  const orchestrator = new WeddingPlanningOrchestrator(budgetService, vendorRepo);

  const correlationId = `AUDIT_${Date.now()}`;
  const prompt = `Hola! Tenemos un presupuesto de $60,000. 
  Aquí tienes nuestro moodboard: https://pinterest.com/boda-vibe. 
  Por favor, audita este contrato del fotógrafo: "Retainer del 55%, no reembolsable en caso de cancelación por clima."`;

  console.log(`[TEST] Prompt Inyectado: ${prompt}`);
  console.log(`[TEST] Correlation ID: ${correlationId}`);

  try {
    const generator = orchestrator.streamPlanning({
      messages: [new HumanMessage(prompt)],
      correlationId,
      tenantId: "TENANT_FINAL_VERIFICATION",
      completedTasks: [],
      // Carga Multimodal Inicial
      financialContext: { totalBudget: 60000, allocations: [] },
      aestheticContext: { moodboardVectors: [0.1, 0.2, 0.3], stylePreferences: ["Elegante", "Rústico"] },
      legalContext: { risks: [], isSafeToProceed: false },
      sharedContext: { foundVendors: [] }
    });

    for await (const event of generator) {
      console.log(`\n>>> EVENTO RECIBIDO [Node: ${event.node}]`);
      console.log(`- Mensaje: ${event.message}`);
      console.log(`- Tareas Completadas: ${event.completedTasks.join(", ")}`);
    }

    console.log("\n=== SIMULACIÓN FINALIZADA CON ÉXITO ===");

  } catch (error) {
    console.error("!!! ERROR EN LA SIMULACIÓN !!!", error);
  }
}

runFinalSimulation();
