import React from 'react';
import { Briefcase, PieChart, Star } from 'lucide-react';

export default function VendorsPage() {
  return (
    <div className="space-y-8 fade-in">
      <header className="space-y-2">
        <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-normal text-[#20201d]">
          <Briefcase className="h-7 w-7 text-[#7a643d]" /> Proveedores y Presupuesto
        </h2>
        <p className="max-w-3xl text-base leading-7 text-[#5d5a52]">Control sobrio de presupuesto y proveedores sugeridos.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="rounded-lg border border-[#d7d2c8] bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-[#20201d]"><PieChart className="text-[#7a643d]" /> Resumen financiero</h3>
          <div className="h-64 rounded-md border border-dashed border-[#d7d2c8] bg-[#f7f7f4] flex items-center justify-center text-[#77736b]">
            Grafico de asignacion de presupuesto
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 sm:p-4 bg-[#f7f7f4] rounded-md">
              <span className="font-medium">Total Presupuestado</span>
              <span className="font-semibold text-lg">$45,000 USD</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#d7d2c8] bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-[#20201d]"><Star className="text-[#7a643d]" /> Proveedores recomendados</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border border-[#ebe7df] rounded-md flex items-center gap-4 hover:border-[#7a643d] transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-[#f7f7f4] rounded-md shrink-0"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#20201d]">Catering Estelar {i}</h4>
                  <div className="text-sm text-[#77736b]">Alineacion de moodboard: 98%</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#20201d]">$12,000</div>
                  <div className="text-xs text-[#2f6b45] font-medium">Bajo presupuesto</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
