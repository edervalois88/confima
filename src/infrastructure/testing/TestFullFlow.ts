import { WeddingPlanningOrchestrator } from '../../application/use-cases/WeddingPlanningOrchestrator';
import { HumanMessage } from '@langchain/core/messages';

async function testFullFlow() {
  const budgetMock = {
    calculateOptimalAllocation: async (total: number) => [
      { category: "Banquete & Lugar", allocated: total * 0.5, spent: 0 },
      { category: "Decoración", allocated: total * 0.2, spent: 0 },
      { category: "Fotografía", allocated: total * 0.15, spent: 0 }
    ],
    updateAllocation: async () => {}
  };

  const vendorMock = {
    searchVendors: async () => [
      { id: "v1", name: "Hacienda del Mar", category: "Banquete", priceRange: "$20k", rating: 4.9 }
    ],
    getContractText: async () => "Contrato OK."
  };

  const orchestrator = new WeddingPlanningOrchestrator(budgetMock, vendorMock);
  const graph = orchestrator.createGraph();
  
  const prompt = "Presupuesto $50,000 para 150 personas. Busca banquete y audita el contrato.";

  const state = {
    messages: [new HumanMessage(prompt)],
    correlationId: "TRACE_50K",
    tenantId: "TENANT_01",
    completedTasks: [],
    context: {}
  };

  console.log('🚀 INICIANDO SIMULACIÓN...');
  const result = await graph.invoke(state);
  
  console.log('\n--- RESULTADOS ---');
  result.messages.forEach((m: any, i: number) => {
    console.log(`[${i}] [${m.role}]: ${m.content.substring(0, 100)}`);
  });
  console.log('--- CIERRE ---');
}

testFullFlow();
