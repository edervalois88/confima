import { PrismaClient } from "@prisma/client";
import { inngest } from "@/infrastructure/jobs/InngestClient";
import { WeddingPlanningOrchestrator } from "@/application/use-cases/WeddingPlanningOrchestrator";
import { LLMProviderFactory } from "@/application/services/LLMProviderFactory";
import { HumanMessage } from "@langchain/core/messages";

const prisma = new PrismaClient();

export const processWhatsappMessage = inngest.createFunction(
  { id: "whatsapp-receiver", triggers: [{ event: "whatsapp/message.received" }] },
  async ({ event, step }) => {
    const { wamid, phone, guestName, text } = event.data;

    await step.run("log-telemetry", async () => {
      console.log(`🤖 [INNGEST] Procesando mensaje en background de: ${phone}`);
    });

    const aiResponse = await step.run("langgraph-orchestrator", async () => {
      // Instanciamos Capa 2 cumpliendo dependencias del Anillo 4
      const budgetService = {
        calculateOptimalAllocation: async (totalBudget: number) => [
          { category: "Invitaciones", allocated: totalBudget * 0.15, spent: 0 },
          { category: "Banquete", allocated: totalBudget * 0.65, spent: 0 },
        ],
        updateAllocation: async () => undefined,
      };
      const vendorRepo = {
        searchVendors: async () => [],
        getContractText: async () => "",
      };
      
      // Reconoce entorno local automáticamente e instancia Ollama (pt. 11434) o OpenAI
      const llmService = LLMProviderFactory.getProvider();

      const orchestrator = new WeddingPlanningOrchestrator(
        budgetService,
        vendorRepo,
        llmService
      );

      // Mutamos formato al requerido por LangGraph
      const planningState = {
        messages: [new HumanMessage(text)],
        correlationId: wamid,
        tenantId: "default-tenant", // En PROD recuperamos desde el teléfono asociado
        source: "whatsapp" as const,
        completedTasks: [],
        financialContext: { allocations: [] },
        aestheticContext: { stylePreferences: [] },
        legalContext: { risks: [], isSafeToProceed: false },
        sharedContext: { foundVendors: [] },
        summary: "",
        nextModule: null
      };

      // Compilación y ejecución total del grafo basado en IA Local
      const graph = orchestrator.createGraph();
      const result = await graph.invoke(planningState);

      // Usualmente el nodo finalizador condensa la respuesta al usuario en "messages"
      const responseMsg = result.messages[result.messages.length - 1];
      return responseMsg?.content || "No message generation.";
    });

    await step.run("mutate-state-postgresql", async () => {
      // Actualizamos estado en base de datos expuesta al puerto 5433 (Segun spec infra)
      // Buscamos al invitado por teléfono
      const guest = await prisma.guestProfile.findFirst({
        where: { phoneFingerprint: phone }
      });

      if (guest) {
        // En un caso real usaríamos la salida analizada de ollama (JSON output)
        await prisma.guestProfile.update({
          where: { id: guest.id },
          data: { rsvpStatus: "CONFIRMED" } // Simulado
        });
      }
    });

    await step.run("send-whatsapp-reply", async () => {
      console.log(`[WHATSAPP ADAPTER] Mocking envío API a ${phone}: "${aiResponse}"`);
      // Aquí iría el POST a `https://graph.facebook.com/v18.0/.../messages`
    });

    return { success: true, aiReplied: aiResponse };
  }
);
