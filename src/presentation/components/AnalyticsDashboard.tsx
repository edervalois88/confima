'use client';

import React from 'react';

/**
 * @fileoverview Dashboard de Analítica Conversacional Post-Evento.
 * Anillo 3: Presentación. React 19 / Modern UX.
 */

export default function AnalyticsDashboard() {
  // En producción, los datos vendrían de un Server Component vía Props o Streaming
  const metrics = [
    { label: "Interacciones Totales", value: "1,240", change: "+12%" },
    { label: "Tasa de Contención", value: "94.2%", change: "+5.1%" },
    { label: "Satisfacción (Sentimiento)", value: "4.8/5", change: "Positivo" },
    { label: "Contingencias Resueltas", value: "8", change: "100%" }
  ];

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen font-sans">
      <header className="mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Intelligence ROI Dashboard
        </h1>
        <p className="text-slate-400 mt-2">Métricas de rendimiento y sentimiento post-evento.</p>
      </header>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {metrics.map((m, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-slate-400 text-sm">{m.label}</p>
            <p className="text-3xl font-bold mt-1">{m.value}</p>
            <div className="text-emerald-400 text-xs mt-2 font-medium">{m.change}</div>
          </div>
        ))}
      </div>

      {/* Gráficos de Sentimiento (Mockup visual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl bg-slate-800/50 border border-white/5">
          <h2 className="text-xl font-semibold mb-6">Desglose de Sentimiento por Categoría</h2>
          <div className="space-y-4">
            {['Catering', 'Música', 'Logística', 'Ceremonia'].map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{cat}</span>
                  <span className="text-emerald-400">{95 - i * 5}% Positivo</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${95 - i * 5}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold">Resiliencia Operativa al 100%</h3>
          <p className="text-slate-400 mt-2 max-w-xs">
            Todas las contingencias detectadas fueron manejadas autónomamente sin intervención humana.
          </p>
        </div>
      </div>
    </div>
  );
}
