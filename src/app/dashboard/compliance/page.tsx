import React from 'react';
import { ShieldAlert, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="space-y-8 fade-in">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-500" /> Auditoría Legal & Compliance
        </h2>
        <p className="text-slate-500 text-lg">Revisión autónoma de contratos, pólizas y cláusulas de riesgo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"><AlertTriangle /></div>
          <h3 className="text-lg font-bold">Riesgos Críticos (0)</h3>
          <p className="text-slate-500 text-sm">No hay cláusulas abusivas detectadas en los últimos 5 contratos analizados.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><FileText /></div>
          <h3 className="text-lg font-bold">Contratos Pendientes (2)</h3>
          <p className="text-slate-500 text-sm">Contrato de locación y banda musical esperando tu firma final.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle /></div>
          <h3 className="text-lg font-bold">Score de Seguridad</h3>
          <div className="text-3xl font-black text-emerald-600">99.9%</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-8">
        <h3 className="text-xl font-bold mb-6">Registro de Auditorías IA</h3>
        <div className="h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
          Actualmente sin contratos nuevos escaneados.
        </div>
      </div>
    </div>
  );
}
