import { IMessagingProvider } from '@/domain/ports/IMessagingProvider';
import { PrismaClient } from '@prisma/client';
import {
  InvitationTemplateDefinition,
  WhatsAppComplianceService,
} from '@/application/services/WhatsAppComplianceService';

/**
 * @fileoverview Caso de Uso para el despacho masivo de invitaciones.
 * Anillo 2: Application.
 */

const prisma = new PrismaClient();

export class DispatchInvitationsUseCase {
  constructor(private readonly messagingProvider: IMessagingProvider) {}

  public async execute(tenantId: string, templateName = InvitationTemplateDefinition.name) {
    // 1. Obtener invitados pendientes de envío
    const guests = await prisma.guestProfile.findMany({
      where: { 
        tenantId,
        rsvpStatus: 'PENDING_SEND' 
      },
      include: { event: true },
    });

    console.log(`[DISPATCH] Iniciando envío de ${guests.length} invitaciones para Tenant ${tenantId}`);

    for (const guest of guests) {
      try {
        const complianceDecision = WhatsAppComplianceService.assessTemplateSend(guest);

        if (!guest.event) {
          await this.auditBlockedInvitation({
            guestId: guest.id,
            eventId: null,
            templateName,
            status: "BLOCKED",
            reason: "El invitado no tiene evento asociado.",
          });
          continue;
        }

        if (!complianceDecision.allowed) {
          await this.auditBlockedInvitation({
            guestId: guest.id,
            eventId: guest.event.id,
            templateName,
            status: complianceDecision.status,
            reason: complianceDecision.reason,
          });
          continue;
        }

        const template = WhatsAppComplianceService.buildInvitationTemplate(guest, guest.event);
        const providerMessageId = await this.messagingProvider.sendTemplateMessage(guest.phoneFingerprint, {
          ...template,
          name: templateName,
        });

        // 2. Actualizar estado a DELIVERED
        await prisma.guestProfile.update({
          where: { id: guest.id },
          data: { rsvpStatus: 'DELIVERED', lastOutboundAt: new Date() }
        });

        await prisma.invitation.create({
          data: {
            eventId: guest.event.id,
            guestId: guest.id,
            templateName,
            templateCategory: InvitationTemplateDefinition.category,
            status: "SENT",
            complianceStatus: complianceDecision.status,
            complianceReason: complianceDecision.reason,
            providerMessageId,
            sentAt: new Date(),
          },
        });

        await prisma.messageLog.create({
          data: {
            tenantId,
            eventId: guest.event.id,
            guestId: guest.id,
            direction: "OUTBOUND",
            body: InvitationTemplateDefinition.sampleBody,
            intent: "INVITATION_SEND",
            messageType: "TEMPLATE",
            templateName,
            complianceStatus: complianceDecision.status,
            complianceReason: complianceDecision.reason,
            providerMessageId,
          },
        });

      } catch (error) {
        console.error(`[DISPATCH_ERROR] Fallo al enviar a ${guest.phoneFingerprint}:`, error);
      }
    }

    return { totalProcessed: guests.length };
  }

  private async auditBlockedInvitation(input: {
    guestId: string;
    eventId: string | null;
    templateName: string;
    status: string;
    reason: string;
  }): Promise<void> {
    if (!input.eventId) {
      await prisma.reservationLog.create({
        data: {
          guestId: input.guestId,
          temporalStartISO: new Date(),
          partySizeCapacity: 0,
          statusState: "INVITATION_BLOCKED",
          riskFactorAexp: 1,
        },
      });
      return;
    }

    await prisma.invitation.create({
      data: {
        eventId: input.eventId,
        guestId: input.guestId,
        templateName: input.templateName,
        templateCategory: InvitationTemplateDefinition.category,
        status: "BLOCKED",
        complianceStatus: input.status,
        complianceReason: input.reason,
      },
    });
  }
}
