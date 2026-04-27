import React from 'react';
import { Settings, Server, Key, Users } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8 fade-in max-w-4xl">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-slate-600" /> Configuración SaaS
        </h2>
        <p className="text-slate-500 text-lg">Parámetros operativos y llaves de acceso para tu Tenant.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 border-b pb-4">
            <Server className="text-indigo-500" />
            <h3 className="font-bold text-lg">Motor IA (AI Backend)</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Provedor Actual</label>
              <div className="font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mt-1 inline-block">Ollama (Modelo Local)</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Modelo Activo</label>
              <div className="font-medium text-slate-800">llama3.1</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 border-b pb-4">
            <Key className="text-amber-500" />
            <h3 className="font-bold text-lg">API Keys & Integraciones</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Retell AI (Voz)</label>
              <input type="password" value="sk_retell_xxxxxxxxxxxxx" readOnly className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm text-slate-500 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">LangSmith (Trazabilidad)</label>
              <input type="password" value="lsv2_pt_xxxxxxxxxxxxx" readOnly className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm text-slate-500 mt-1" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4 md:col-span-2">
          <div className="flex items-center gap-3 border-b pb-4">
            <Users className="text-pink-500" />
            <h3 className="font-bold text-lg">Preferencias del Tenant</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
            <div>
              <div className="font-bold text-slate-800">Recordatorios Automáticos (WhatsApp)</div>
              <div className="text-sm text-slate-500">Envía pings autómaticos a invitados sin confirmar 7 días antes.</div>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full cursor-pointer relative transition-all">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
