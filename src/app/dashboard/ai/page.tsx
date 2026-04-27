import React from 'react';
import { Bot, Mic, MessageSquare, Activity } from 'lucide-react';
import { StreamingPlanner } from '@/presentation/components/StreamingPlanner';

export default function AIConsolePage() {
  return (
    <div className="space-y-8 fade-in h-[calc(100vh-8rem)] flex flex-col">
      <header className="space-y-2 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Bot className="w-8 h-8 text-pink-500" /> Conserje Multimodal IA
        </h2>
        <p className="text-slate-500 text-lg">Monitoreo en tiempo real del motor LangGraph y agentes de Voz/WhatsApp.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Activity className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Estado LangGraph</div>
            <div className="text-xl font-black text-slate-900">Operativo</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-pink-100 text-pink-600 rounded-xl"><Mic className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Llamadas (Hoy)</div>
            <div className="text-xl font-black text-slate-900">14</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><MessageSquare className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Mensajes WA</div>
            <div className="text-xl font-black text-slate-900">128</div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-pink-100 shadow-[0_10px_40px_-20px_rgba(236,72,153,0.15)] p-8 relative overflow-hidden flex flex-col min-h-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        <StreamingPlanner />
      </div>
    </div>
  );
}
