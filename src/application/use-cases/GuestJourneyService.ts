import { prisma } from '@/infrastructure/database/prisma';
import { DomainError } from '@/domain/errors/DomainError';

/**
 * @fileoverview Servicio de Gestión de Invitados SaaS.
 * Anillo 2: Application.
 */

export class GuestJourneyService {
  /**
   * Registra un invitado asegurando que el Tenant tiene el Feature Flag activo.
   */
  public async registerGuestFromWhatsApp(
    tenantId: string, 
    phone: string, 
    source: 'WHATSAPP' | 'MANUAL'
  ) {
    // 1. Validar Suscripción
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId }
    });

    if (!subscription) {
      throw new DomainError("El Tenant no posee una suscripción activa.");
    }

    // 2. Persistencia con integridad SaaS
    return await prisma.guestProfile.upsert({
      where: { 
        tenantId_phoneFingerprint: { tenantId, phoneFingerprint: phone } 
      },
      update: { contactSource: source },
      create: {
        tenantId,
        phoneFingerprint: phone,
        contactSource: source,
        rsvpStatus: 'PENDING'
      }
    });
  }
}
