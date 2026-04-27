'use client';

import React, { useState } from 'react';
import { getVoiceSessionToken } from '@/app/actions/voiceActions';

/**
 * @fileoverview Widget de llamada de voz WebRTC para el portal del invitado.
 * Anillo 3: Presentación. Implementa la conexión con Retell AI.
 */

export default function VoiceCallWidget({ tenantId }: { tenantId: string }) {
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);

  const startCall = async () => {
    setIsCalling(true);
    setCallStatus("Iniciando conexión segura...");

    try {
      // 1. Obtener token mediante Server Action (Arquitectura Mediada)
      const session = await getVoiceSessionToken(tenantId);
      
      // 2. Inicializar SDK de Retell (Simulado en este entorno)
      console.log(`[VOICE_WIDGET] Conectando a Retell con Token: \${session.accessToken}`);
      
      setCallStatus("Llamada en curso...");
      
      // Simulación de interacción
      setTimeout(() => {
        setCallStatus("Sincronizando RSVP verbal...");
      }, 3000);

    } catch (error: any) {
      setCallStatus("Error de conexión.");
      setIsCalling(false);
    }
  };

  const endCall = () => {
    setIsCalling(false);
    setCallStatus(null);
    console.log("[VOICE_WIDGET] Llamada finalizada por el usuario.");
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {!isCalling ? (
        <button
          onClick={startCall}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all flex items-center gap-3 animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="font-semibold px-2">Llamar al Conserje</span>
        </button>
      ) : (
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl w-72 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">En Vivo</span>
            </div>
            <button onClick={endCall} className="text-slate-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="text-center py-4">
            <p className="text-white text-lg font-medium">Conserje IA</p>
            <p className="text-slate-400 text-xs mt-1">{callStatus}</p>
          </div>

          <button
            onClick={endCall}
            className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-3 rounded-xl font-medium transition-colors"
          >
            Finalizar Llamada
          </button>
        </div>
      )}
    </div>
  );
}
