import React from 'react';
import { Bot, Mic, MessageSquare, Activity } from 'lucide-react';
import { StreamingPlanner } from '@/presentation/components/StreamingPlanner';

export default function AIConsolePage() {
  return (
    <div className="space-y-8 fade-in h-[calc(100vh-8rem)] flex flex-col">
      <header className="space-y-2 shrink-0">
        <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-normal text-[#20201d]">
          <Bot className="h-7 w-7 text-[#7a643d]" /> Asistente WhatsApp
        </h2>
        <p className="max-w-3xl text-base leading-7 text-[#5d5a52]">Monitoreo operativo del asistente, conversaciones y degradacion entre modelos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <div className="rounded-lg border border-[#d7d2c8] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-md bg-[#eef6f0] p-3 text-[#2f6b45]"><Activity className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-semibold text-[#77736b]">Estado IA</div>
            <div className="text-xl font-semibold text-[#20201d]">Operativo</div>
          </div>
        </div>
        <div className="rounded-lg border border-[#d7d2c8] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-md bg-[#f5f0e7] p-3 text-[#7a643d]"><Mic className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-semibold text-[#77736b]">Llamadas hoy</div>
            <div className="text-xl font-semibold text-[#20201d]">0</div>
          </div>
        </div>
        <div className="rounded-lg border border-[#d7d2c8] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-md bg-[#eef6f0] p-3 text-[#2f6b45]"><MessageSquare className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-semibold text-[#77736b]">Mensajes WA</div>
            <div className="text-xl font-semibold text-[#20201d]">60</div>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-lg border border-[#d7d2c8] bg-white p-5 shadow-sm sm:p-8 relative overflow-hidden flex flex-col min-h-0">
        <StreamingPlanner />
      </div>
    </div>
  );
}
