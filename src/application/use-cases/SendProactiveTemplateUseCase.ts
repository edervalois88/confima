import { IMessagingProvider } from "../../domain/ports/IMessagingProvider";
import { WhatsAppComplianceService } from "@/application/services/WhatsAppComplianceService";
import { prisma } from "@/infrastructure/database/prisma";

/**
 * @fileoverview Caso de Uso para el envío proactivo de plantillas (RSVP, Mapas, etc.).
 * Anillo 2: Aplicación.
 */

export class SendProactiveTemplateUseCase {
  constructor(private readonly messagingProvider: IMessagingProvider) {}

  public async execute(guestId: string, templateName: string, variables: string[]) {
    // 1. Recuperar perfil del invitado
    const guest = await prisma.guestProfile.findUnique({
      where: { id: guestId },
      include: { event: true },
    });

    if (!guest) {
      throw new Error(`[PROACTIVE_ERROR] Guest with ID ${guestId} not found.`);
    }

    console.log(`[PROACTIVE] Enviando plantilla '${templateName}' a ${guest.phoneFingerprint}`);

    const complianceDecision = WhatsAppComplianceService.assessTemplateSend(guest);

    if (!complianceDecision.allowed) {
      await prisma.reservationLog.create({
        data: {
          guestId: guest.id,
          temporalStartISO: new Date(),
          partySizeCapacity: 0,
          statusState: "TEMPLATE_BLOCKED",
          riskFactorAexp: 1.0,
        },
      });

      return { messageId: "", blocked: true, reason: complianceDecision.reason };
    }

    // 2. Despachar plantilla
    const messageId = await this.messagingProvider.sendTemplateMessage(guest.phoneFingerprint, {
      name: templateName,
      language: "es",
      components: [
        {
          type: "body",
          parameters: variables.map(v => ({ type: "text", text: v }))
        }
      ]
    });

    await prisma.messageLog.create({
      data: {
        tenantId: guest.tenantId,
        eventId: guest.eventId,
        guestId: guest.id,
        direction: "OUTBOUND",
        body: `Template ${templateName}`,
        intent: "PROACTIVE_TEMPLATE",
        messageType: "TEMPLATE",
        templateName,
        complianceStatus: complianceDecision.status,
        complianceReason: complianceDecision.reason,
        providerMessageId: messageId,
      },
    });

    // 3. Auditoría en ReservationLog
    await prisma.reservationLog.create({
      data: {
        guestId: guest.id,
        temporalStartISO: new Date(),
        partySizeCapacity: 0,
        statusState: "TEMPLATE_SENT",
        riskFactorAexp: 1.0 // Marcador de proactividad
      }
    });

    return { messageId };
  }
}
