import React from 'react';
import { Settings, Server, Key, Users } from 'lucide-react';

export default function SettingsPage() {
  const provider = process.env.LLM_PROVIDER || 'auto';
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const googleModel = process.env.GOOGLE_AI_MODEL || 'gemini-flash-latest';

  return (
    <div className="space-y-8 fade-in max-w-4xl">
      <header className="space-y-2">
        <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-normal text-[#20201d]">
          <Settings className="h-7 w-7 text-[#7a643d]" /> Configuracion
        </h2>
        <p className="max-w-3xl text-base leading-7 text-[#5d5a52]">Parametros operativos para IA, WhatsApp y preferencias del tenant.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-[#d7d2c8] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b pb-4">
            <Server className="text-[#7a643d]" />
            <h3 className="font-semibold text-lg text-[#20201d]">Motor IA</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#77736b] uppercase">Proveedor actual</label>
              <div className="font-semibold text-[#2f6b45] bg-[#eef6f0] px-3 py-2 rounded-md mt-1 inline-block">{provider}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#77736b] uppercase">Modelos de respaldo</label>
              <div className="font-medium text-[#20201d]">{groqModel} / {googleModel}</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#d7d2c8] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b pb-4">
            <Key className="text-[#7a643d]" />
            <h3 className="font-semibold text-lg text-[#20201d]">Integraciones</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#77736b] uppercase">WhatsApp Cloud API</label>
              <input type="password" value="configured-in-vercel" readOnly className="w-full bg-[#f7f7f4] border border-[#d7d2c8] rounded-md px-3 py-2 text-sm text-[#77736b] mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#77736b] uppercase">LLM Keys</label>
              <input type="password" value="configured-in-vercel" readOnly className="w-full bg-[#f7f7f4] border border-[#d7d2c8] rounded-md px-3 py-2 text-sm text-[#77736b] mt-1" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#d7d2c8] bg-white p-6 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-3 border-b pb-4">
            <Users className="text-[#7a643d]" />
            <h3 className="font-semibold text-lg text-[#20201d]">Preferencias del tenant</h3>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-[#f7f7f4] rounded-md border border-[#ebe7df]">
            <div>
              <div className="font-semibold text-[#20201d]">Recordatorios automaticos por WhatsApp</div>
              <div className="text-sm text-[#5d5a52]">Envio escalonado a invitados sin confirmar antes del evento.</div>
            </div>
            <div className="w-12 h-6 bg-[#2f6b45] rounded-full cursor-pointer relative transition-all">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
