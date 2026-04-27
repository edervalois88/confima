import React from 'react';
import { Briefcase, CreditCard, PieChart, Star } from 'lucide-react';

export default function VendorsPage() {
  return (
    <div className="space-y-8 fade-in">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-amber-500" /> Proveedores y Presupuesto
        </h2>
        <p className="text-slate-500 text-lg">Optimización matemática y matching estético.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><PieChart className="text-slate-400" /> Resumen Financiero</h3>
          <div className="h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
            [Gráfico de Asignación de Presupuesto]
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-xl">
              <span className="font-medium">Total Presupuestado</span>
              <span className="font-black text-lg">$45,000 USD</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><Star className="text-amber-400" /> Proveedores Recomendados (IA)</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border rounded-xl flex items-center gap-4 hover:border-amber-400 transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-slate-100 rounded-lg shrink-0"></div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">Catering Estelar {i}</h4>
                  <div className="text-sm text-slate-500">Alineación de Moodboard: 98%</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">$12,000</div>
                  <div className="text-xs text-emerald-600 font-medium">Bajo Presupuesto</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
