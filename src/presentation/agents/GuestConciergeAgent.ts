import { StateGraph, END, START } from '@langchain/langgraph';
import { z } from 'zod';
import { ILLMService } from '@/application/ports/ILLMService';

/**
 * @fileoverview Grafo de Conserje Proactivo con validación de Feature Flags SaaS.
 * Anillo 3: Presentación / Orquestación Multi-Tenant.
 */

export const ConciergeStateSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  tenantFeatureFlags: z.object({
    canUploadExcel: z.boolean(),
    hasWeatherConcierge: z.boolean(),
    hasMapLogistics: z.boolean()
  }),
  nextAction: z.string().optional()
});

export type ConciergeState = z.infer<typeof ConciergeStateSchema>;

export class GuestConciergeAgent {
  constructor(private readonly llmService: ILLMService) {}

  public createGraph() {
    const workflow: StateGraph<ConciergeState, ConciergeState, Partial<ConciergeState>, string> = new StateGraph<ConciergeState>({
      channels: {
        messages: { value: (x, y) => x.concat(y), default: () => [] },
        tenantFeatureFlags: { value: (x, y) => y ?? x, default: () => ({ canUploadExcel: false, hasWeatherConcierge: false, hasMapLogistics: false }) },
        nextAction: { value: (x, y) => y ?? x, default: () => 'IDLE' }
      }
    });

    // Nodo Supervisor: Evalúa intención e inyecta reglas SaaS
    workflow.addNode('supervisor', async (state) => {
      const lastMessage = (state.messages[state.messages.length - 1]?.content || "").toString().toUpperCase();
      
      // 1. Manejo Determinista de Postbacks (Ahorro de tokens y latencia)
      if (lastMessage.includes('WEATHER_QUERY')) return { nextAction: 'weatherNode' };
      if (lastMessage.includes('MAP_QUERY')) return { nextAction: 'logisticsNode' };
      
      // 2. Evaluación Cognitiva para lenguaje natural
      const prompt = `Eres un Conserje Proactivo de Bodas. 
      Tus capacidades actuales según el plan del cliente son: 
      - Clima: ${state.tenantFeatureFlags.hasWeatherConcierge ? 'HABILITADO' : 'DESHABILITADO'}
      - Mapas/Logística: ${state.tenantFeatureFlags.hasMapLogistics ? 'HABILITADO' : 'DESHABILITADO'}
      
      Si el usuario responde a la invitación de forma compleja o agresiva, transfiere a un humano usando handoffNode.`;

      const response = await this.llmService.processIntent(prompt, state.messages);
      
      let next = 'END';
      if (response.includes('LOGISTICS')) next = 'logisticsNode';
      if (response.includes('WEATHER')) next = 'weatherNode';
      if (response.includes('HANDOFF')) next = 'handoffNode';

      return { nextAction: next };
    });


    workflow.addNode('logisticsNode', async () => {
      return { messages: [{ role: 'assistant', content: "Aquí tienes la ubicación del evento." }] };
    });

    workflow.addNode('handoffNode', async () => {
      console.log("[HANDOFF] Transfiriendo conversación a operador humano.");
      return { messages: [{ role: 'assistant', content: "Mmm, esa es una excelente pregunta que requiere atención personalizada. Dame un momento para contactar a los anfitriones por ti." }] };
    });


    workflow.addNode('weatherNode', async () => {
      return { messages: [{ role: 'assistant', content: "El pronóstico para el día de la boda es de 24°C, cielo despejado." }] };
    });

    workflow.addEdge(START, 'supervisor');
    
    workflow.addConditionalEdges('supervisor', (state) => {
      if (state.nextAction === 'logisticsNode') return 'logisticsNode';
      if (state.nextAction === 'weatherNode') return 'weatherNode';
      return END;
    });

    workflow.addEdge('logisticsNode', END);
    workflow.addEdge('weatherNode', END);

    return workflow.compile();
  }
}
