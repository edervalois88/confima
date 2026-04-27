import { WeddingPlanningOrchestrator } from '../../application/use-cases/WeddingPlanningOrchestrator';

import { HumanMessage } from '@langchain/core/messages';

async function testOrchestrator() {
  const orchestrator = new WeddingPlanningOrchestrator(
    { calculateOptimalAllocation: async () => [], updateAllocation: async () => {} },
    { searchVendors: async () => [], getContractText: async () => "" }
  );

  const app = orchestrator.createGraph();
  
  const initialState = {
    messages: [new HumanMessage("Necesito ayuda con mi presupuesto y buscar un fotógrafo.")],
    correlationId: "CORR_" + Date.now(),
    tenantId: "TENANT_BODA_PREMIUM",
    context: {}
  };

  console.log('🚀 Iniciando Orquestador Multi-Agente...');
  const result = await app.invoke(initialState);
  
  console.log('\n--- TRAZABILIDAD DEL GRAFO ---');
  result.messages.forEach((m: any) => console.log(`[${m.role.toUpperCase()}]: ${m.content}`));
  console.log('------------------------------\n');
}

testOrchestrator();
