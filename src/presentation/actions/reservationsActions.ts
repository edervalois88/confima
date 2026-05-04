'use server';

import { PrismaReservationRepository } from '@/infrastructure/database/PrismaReservationRepository';
import { CreateReservationUseCase } from '@/application/use-cases/CreateReservationUseCase';
import { VercelAIService } from '@/infrastructure/ai/VercelAIService';
import { revalidatePath } from 'next/cache';

/**
 * @fileoverview Server Actions para la gestión de reservas.
 * Anillo 3: Puente entre la UI y los casos de uso.
 */

export async function createReservationAction(formData: FormData) {
  const reservationRepository = new PrismaReservationRepository();
  const llmService = new VercelAIService();
  const createReservationUseCase = new CreateReservationUseCase(reservationRepository, llmService);

  const customerId = formData.get('customerId') as string;
  const date = formData.get('date') as string;
  const partySize = parseInt(formData.get('partySize') as string);

  try {
    await createReservationUseCase.execute({
      customerId,
      temporalStartISO: new Date(date).toISOString(),
      partySize,
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}
