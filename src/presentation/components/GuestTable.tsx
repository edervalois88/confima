'use client';

import React, { useOptimistic, useTransition, useState } from 'react';
import { updateGuestRSVPAction } from '@/presentation/actions/guestActions';
import { motion } from 'framer-motion';


export interface Guest {
  id: string;
  name: string;
  rsvpStatus: string;
  phone: string;
  partySize: number;
  specialNeed?: string;
  eventName?: string;
  optInStatus?: string;
  messagingPaused?: boolean;
}

interface GuestTableProps {
  guests: Guest[];
}

export function GuestTable({ guests: initialGuests }: GuestTableProps) {
  const [isPending, startTransition] = useTransition();
  const [guests, setGuests] = useState<Guest[]>(initialGuests);

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
      setGuests(prev => prev.map(g => g.id === id ? { ...g, rsvpStatus: newStatus } : g));
      
      // 2. Persistencia en Servidor
      await updateGuestRSVPAction(id, newStatus);
    });
  };

  if (optimisticGuests.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-[#d7d2c8] text-sm text-[#77736b]">
        No hay invitados cargados en la base de datos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left">
        <thead>
          <tr className="border-b border-[#ebe7df] text-[#77736b] text-xs font-semibold uppercase tracking-widest">
            <th className="pb-4 pt-2">Invitado</th>
            <th className="pb-4 pt-2">Evento</th>
            <th className="pb-4 pt-2">Telefono</th>
            <th className="pb-4 pt-2">Pases</th>
            <th className="pb-4 pt-2">Necesidad</th>
            <th className="pb-4 pt-2">Estado</th>
            <th className="pb-4 pt-2">WA</th>
            <th className="pb-4 pt-2">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ebe7df] text-[#5d5a52]">
          {optimisticGuests.map((guest, index) => (
            <motion.tr
              key={guest.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.12) }}
              className="group hover:bg-[#f7f7f4] transition-colors"
            >
              <td className="py-4 font-medium text-[#20201d]">{guest.name}</td>
              <td className="py-4 text-sm">{guest.eventName ?? 'Sin evento'}</td>
              <td className="py-4 text-sm">{guest.phone}</td>
              <td className="py-4 text-sm">{guest.partySize}</td>
              <td className="py-4 text-sm">{guest.specialNeed ?? 'Sin registro'}</td>
              <td className="py-4">
                <span className={cnStatus(guest.rsvpStatus)}>
                  {statusLabel(guest.rsvpStatus)}
                </span>
              </td>
              <td className="py-4">
                <span className={cnWhatsappStatus(guest)}>
                  {guest.messagingPaused ? 'Pausado' : guest.optInStatus ?? 'UNKNOWN'}
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
            </motion.tr>
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

function statusLabel(status: string) {
  switch (status) {
    case 'CONFIRMED': return 'Confirmado';
    case 'DECLINED': return 'No asiste';
    case 'DELIVERED': return 'Entregado';
    case 'READ': return 'Leido';
    default: return 'Por enviar';
  }
}

function cnWhatsappStatus(guest: Guest) {
  if (guest.messagingPaused) return 'px-2 py-1 bg-[#f8eeee] text-[#8e3f3f] rounded-md text-[10px] font-bold';
  if (guest.optInStatus === 'OBTAINED' || guest.optInStatus === 'INBOUND_INITIATED') {
    return 'px-2 py-1 bg-[#eef6f0] text-[#2f6b45] rounded-md text-[10px] font-bold';
  }

  return 'px-2 py-1 bg-[#f5f0e7] text-[#7a643d] rounded-md text-[10px] font-bold';
}
