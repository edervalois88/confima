'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * @fileoverview Hook para sincronización de reservas en tiempo real vía Supabase.
 * Anillo 3: Hidratación optimista de la UI.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useLiveReservationsSynchronization() {
  const [reservations, setReservations] = useState<unknown[]>([]);

  useEffect(() => {
    // Suscripción al canal de cambios en la tabla ReservationLog
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ReservationLog',
        },
        (payload) => {
          console.log('Cambio detectado en tiempo real:', payload);
          setReservations((current) => [payload, ...current].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { reservations };
}
