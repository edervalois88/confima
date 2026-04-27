'use client';

import React, { useOptimistic, useTransition, useEffect, useState } from 'react';
import { updateGuestRSVPAction } from '@/presentation/actions/guestActions';
import { cn } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';


export interface Guest {
  id: string;
  name: string;
  rsvpStatus: string;
  phone: string;
  partySize: number;
  specialNeed?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key'
);

export function GuestTable() {
  const [isPending, startTransition] = useTransition();
  const [guests, setGuests] = useState<Guest[]>([
    { id: '1', name: 'Alfonso Valois', phone: '+52 55 4100 1001', partySize: 2, rsvpStatus: 'PENDING_SEND' },
    { id: '2', name: 'Claudia Eder', phone: '+52 55 4100 1002', partySize: 1, rsvpStatus: 'DELIVERED', specialNeed: 'Sin gluten' },
    { id: '3', name: 'Roberto Juarez', phone: '+52 55 4100 1003', partySize: 4, rsvpStatus: 'CONFIRMED' },
  ]);

  // Suscripción Realtime
  useEffect(() => {
    const channel = supabase
      .channel('guest_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'GuestProfile' }, (payload) => {
        console.log('[REALTIME] Cambio detectado:', payload);
        const updated = payload.new as Guest;
        setGuests(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // UI Optimista basada en el estado local 'guests'
  const [optimisticGuests, addOptimisticGuest] = useOptimistic(
    guests,
    (state, updatedGuest: Partial<Guest>) => 
      state.map(g => g.id === updatedGuest.id ? { ...g, ...updatedGuest } : g)
  );


  const handleStatusChange = async (id: string, newStatus: string) => {
    startTransition(async () => {
      // 1. Actualización Optimista (Inmediata)
      addOptimisticGuest({ id, rsvpStatus: newStatus });
      
      // 2. Persistencia en Servidor
      await updateGuestRSVPAction(id, newStatus).catch((error) => {
        console.warn("[GUEST_TABLE] No se pudo persistir el cambio en modo demo.", error);
      });
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#ebe7df] text-[#77736b] text-xs font-semibold uppercase tracking-widest">
            <th className="pb-4 pt-2">Invitado</th>
            <th className="pb-4 pt-2">Telefono</th>
            <th className="pb-4 pt-2">Pases</th>
            <th className="pb-4 pt-2">Necesidad</th>
            <th className="pb-4 pt-2">Estado</th>
            <th className="pb-4 pt-2">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ebe7df] text-[#5d5a52]">
          {optimisticGuests.map((guest) => (
            <tr key={guest.id} className="group hover:bg-[#f7f7f4] transition-colors">
              <td className="py-4 font-medium text-[#20201d]">{guest.name}</td>
              <td className="py-4 text-sm">{guest.phone}</td>
              <td className="py-4 text-sm">{guest.partySize}</td>
              <td className="py-4 text-sm">{guest.specialNeed ?? 'Sin registro'}</td>
              <td className="py-4">
                <span className={cnStatus(guest.rsvpStatus)}>
                  {guest.rsvpStatus}
                </span>
              </td>
              <td className="py-4">
                <select 
                  className="bg-white border border-[#d7d2c8] rounded-md text-xs p-2"
                  value={guest.rsvpStatus}
                  onChange={(e) => handleStatusChange(guest.id, e.target.value)}
                >
                  <option value="PENDING_SEND">Por enviar</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="DECLINED">Declinado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isPending && <div className="text-[10px] text-[#7a643d] mt-2 animate-pulse">Sincronizando con servidor...</div>}
    </div>
  );
}

function cnStatus(status: string) {
  switch (status) {
    case 'CONFIRMED': return 'px-2 py-1 bg-[#eef6f0] text-[#2f6b45] rounded-md text-[10px] font-bold';
    case 'DECLINED': return 'px-2 py-1 bg-[#f8eeee] text-[#8e3f3f] rounded-md text-[10px] font-bold';
    case 'DELIVERED': return 'px-2 py-1 bg-[#f5f0e7] text-[#7a643d] rounded-md text-[10px] font-bold';
    default: return 'px-2 py-1 bg-[#f7f7f4] text-[#5d5a52] rounded-md text-[10px] font-bold';
  }
}
