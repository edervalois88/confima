'use client';

import React, { useState } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { z } from 'zod';
import { runPlanningStreamAction } from '@/app/actions/plannerOrchestratorAction';
import { Skeleton } from './Skeleton';
import { CheckCircle2, CircleDashed, Rocket } from 'lucide-react';

/**
 * @fileoverview Componente de Generative UI para visualizar el streaming de agentes.
 * Anillo 3: Interfaz de Usuario.
 */

export function StreamingPlanner() {
  const [prompt, setPrompt] = useState("");
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const startPlanning = async () => {
    setIsStreaming(true);
    setEvents([]);
    
    const { output } = await runPlanningStreamAction(prompt);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setEvents(prev => [...prev, PlanningEventSchema.parse(delta)]);
      }
    }
    setIsStreaming(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input 
          className="flex-1 p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 outline-none transition-all"
          placeholder="Ej: Planea mi presupuesto de $40k y busca fotógrafos..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button 
          onClick={startPlanning}
          disabled={isStreaming || !prompt}
          className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          <Rocket className="w-4 h-4" />
          Planificar con IA
        </button>
      </div>

      {/* Thought Process UI */}
      <div className="space-y-4">
        {events.map((event, i) => (
          <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mt-1">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Agente {event.node} finalizado
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{event.message}</p>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CircleDashed className="w-5 h-5 text-pink-500 animate-spin" />
            <div className="space-y-2 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 animate-pulse">
                Procesando siguiente paso cognitivo...
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const PlanningEventSchema = {
  parse(value: unknown): PlanningEvent {
    const parsed = PlanningEventZodSchema.safeParse(value);
    if (parsed.success) {
      return parsed.data;
    }

    return {
      node: "sistema",
      message: "Se recibio una actualizacion del orquestador sin formato visible.",
    };
  }
};

const PlanningEventZodSchema = z.object({
  node: z.string(),
  message: z.string(),
});

interface PlanningEvent {
  node: string;
  message: string;
}
