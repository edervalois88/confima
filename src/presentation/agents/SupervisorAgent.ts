import { StateGraph, END, START } from '@langchain/langgraph';
import { z } from 'zod';
import { ILLMService } from '@/application/ports/ILLMService';

/**
 * @fileoverview Orquestación de Agente Supervisor Central usando LangGraph.
 * Anillo 3: Adaptador de presentación para la lógica cognitiva.
 */

export const AgentStateSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  next: z.string().optional(),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

export class SupervisorAgent {
  constructor(private readonly llmService: ILLMService) {}

  /**
   * Define el flujo del grafo supervisor.
   */
  public createGraph() {
    const workflow: StateGraph<AgentState, AgentState, Partial<AgentState>, string> = new StateGraph<AgentState>({
      channels: {
        messages: {
          value: (x, y) => x.concat(y),
          default: () => [],
        },
        next: {
          value: (x, y) => y ?? x,
          default: () => 'END',
        }
      }
    });

    // Nodo de Decisión: Clasifica la intención y enruta al especialista
    workflow.addNode('supervisor', async (state) => {
      const response = await this.llmService.processIntent(
        "Eres un supervisor de un sistema de invitaciones para bodas. " +
        "Clasifica la intencion en: BOOKING_SPECIALIST, SUPPORT_SPECIALIST, o ACCOUNTING_SPECIALIST. " +
        "Responde solo con la etiqueta.",
        state.messages
      );

      return { next: response.trim() };
    });

    workflow.addNode('BOOKING_SPECIALIST', async () => {
        // En un sistema real, aquí llamaríamos a otro grafo o herramienta
        return { messages: [{ role: 'assistant', content: "Derivando al especialista de confirmaciones..." }], next: 'END' };
    });

    workflow.addEdge(START, 'supervisor');
    
    workflow.addConditionalEdges('supervisor', (state) => {
        return state.next === 'BOOKING_SPECIALIST' ? 'BOOKING_SPECIALIST' : 'END';
    });
    
    workflow.addEdge('BOOKING_SPECIALIST', END);

    return workflow.compile();
  }
}
