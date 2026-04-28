'use client';

import React, { useState } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { z } from 'zod';
import { runPlanningStreamAction } from '@/app/actions/plannerOrchestratorAction';
import { Skeleton } from './Skeleton';
import { CheckCircle2, CircleDashed, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <div className="flex flex-col gap-3 sm:flex-row">
        <input 
          className="flex-1 rounded-md border border-[#d7d2c8] bg-white p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#7a643d]/20"
          placeholder="Ej: Planea mi presupuesto de $40k y busca fotógrafos..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button 
          onClick={startPlanning}
          disabled={isStreaming || !prompt}
          className="flex items-center justify-center gap-2 rounded-md bg-[#20201d] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#36332f] disabled:opacity-50"
        >
          <Rocket className="w-4 h-4" />
          Planificar con IA
        </button>
      </div>

      {/* Thought Process UI */}
      <div className="space-y-4">
        {events.map((event, i) => (
          <motion.div
            key={`${event.node}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="flex gap-4 rounded-md border border-[#ebe7df] bg-white p-4"
          >
            <div className="mt-1">
              <CheckCircle2 className="w-5 h-5 text-[#2f6b45]" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77736b]">
                Agente {event.node} finalizado
              </div>
              <p className="text-[#5d5a52] text-sm leading-relaxed">{event.message}</p>
            </div>
          </motion.div>
        ))}

        {isStreaming && (
          <div className="flex gap-4 rounded-md border border-dashed border-[#d7d2c8] bg-[#f7f7f4] p-4">
            <CircleDashed className="w-5 h-5 text-[#7a643d] animate-spin" />
            <div className="space-y-2 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77736b] animate-pulse">
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
