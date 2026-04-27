'use server';

import { createStreamableValue } from 'ai/rsc';
import { WeddingPlanningOrchestrator } from '@/application/use-cases/WeddingPlanningOrchestrator';
import { ConversationMessage } from '@/application/ports/ILLMService';
import { HumanMessage } from '@langchain/core/messages';

/**
 * @fileoverview Server Action para exponer el orquestador con streaming.
 * Anillo 3: Adaptadores de Entrada.
 */

// Mocks de servicios (En producción se inyectan desde el contenedor de DI)
const budgetService = {
  calculateOptimalAllocation: async (total: number) => [
    { category: "Banquete", allocated: total * 0.5, spent: 0 },
    { category: "Decoracion", allocated: total * 0.2, spent: 0 }
  ],
  updateAllocation: async () => undefined
};

const vendorRepo = {
  searchVendors: async () => [{ id: "1", name: "Hacienda Real", category: "Lugar", priceRange: "$$$", rating: 5 }],
  getContractText: async () => "Contrato seguro."
};

const llmService = {
  processIntent: async (_systemContext: string, history: ConversationMessage[]) => {
    return history.at(-1)?.content ?? "Sin mensaje";
  }
};

const orchestrator = new WeddingPlanningOrchestrator(budgetService, vendorRepo, llmService);

export async function runPlanningStreamAction(prompt: string) {
  const stream = createStreamableValue();
  const correlationId = `WEB_${Date.now()}`;

  (async () => {
    try {
      const generator = orchestrator.streamPlanning({
        messages: [new HumanMessage(prompt)],
        correlationId,
        tenantId: "TENANT_WEB_DEMO",
        completedTasks: [],
      });

      for await (const event of generator) {
        stream.update(event);
      }

      stream.done({ status: "finished" });
    } catch (error) {
      console.error("[SERVER_ACTION_ERROR]", error);
      stream.error(error);
    }
  })();

  return { output: stream.value };
}
