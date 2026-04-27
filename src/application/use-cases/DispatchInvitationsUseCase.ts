import { IMessagingProvider } from '@/domain/ports/IMessagingProvider';
import { PrismaClient } from '@prisma/client';

/**
 * @fileoverview Caso de Uso para el despacho masivo de invitaciones.
 * Anillo 2: Application.
 */

const prisma = new PrismaClient();

export class DispatchInvitationsUseCase {
  constructor(private readonly messagingProvider: IMessagingProvider) {}

  public async execute(tenantId: string, templateName: string) {
    // 1. Obtener invitados pendientes de envío
    const guests = await prisma.guestProfile.findMany({
      where: { 
        tenantId,
        rsvpStatus: 'PENDING_SEND' 
      }
    });

    console.log(`[DISPATCH] Iniciando envío de ${guests.length} invitaciones para Tenant ${tenantId}`);

    for (const guest of guests) {
      try {
        await this.messagingProvider.sendTemplateMessage(guest.phoneFingerprint, {
          name: templateName,
          language: 'es',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: 'Invitado' }, // Variable {{1}}
                { type: 'text', text: 'Nuestra Boda' } // Variable {{2}}
              ]
            }
          ]
        });

        // 2. Actualizar estado a DELIVERED
        await prisma.guestProfile.update({
          where: { id: guest.id },
          data: { rsvpStatus: 'DELIVERED' }
        });

      } catch (error) {
        console.error(`[DISPATCH_ERROR] Fallo al enviar a ${guest.phoneFingerprint}:`, error);
      }
    }

    return { totalProcessed: guests.length };
  }
}
