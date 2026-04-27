'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * @fileoverview Acciones de servidor para la gestión de invitados.
 * Anillo 3: Adaptadores de Entrada.
 */

const prisma = new PrismaClient();

export async function updateGuestRSVPAction(guestId: string, status: string) {
  console.log(`[ACTION] Actualizando RSVP de ${guestId} a ${status}`);
  
  // En un entorno Multi-Tenant real, aquí se inyectaría el tenantId
  await prisma.guestProfile.update({
    where: { id: guestId },
    data: {
      rsvpStatus: status,
      lastInboundAt: status === 'CONFIRMED' || status === 'DECLINED' ? new Date() : undefined,
    }
  });

  revalidatePath('/dashboard/guests');
  revalidatePath('/dashboard');
  return { success: true };
}
