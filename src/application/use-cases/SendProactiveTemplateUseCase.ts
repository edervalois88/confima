import { IMessagingProvider } from "../../domain/ports/IMessagingProvider";
import { PrismaClient } from "@prisma/client";

/**
 * @fileoverview Caso de Uso para el envío proactivo de plantillas (RSVP, Mapas, etc.).
 * Anillo 2: Aplicación.
 */

const prisma = new PrismaClient();

export class SendProactiveTemplateUseCase {
  constructor(private readonly messagingProvider: IMessagingProvider) {}

  public async execute(guestId: string, templateName: string, variables: string[]) {
    // 1. Recuperar perfil del invitado
    const guest = await prisma.guestProfile.findUnique({
      where: { id: guestId }
    });

    if (!guest) {
      throw new Error(`[PROACTIVE_ERROR] Guest with ID \${guestId} not found.`);
    }

    console.log(`[PROACTIVE] Enviando plantilla '\${templateName}' a \${guest.phoneFingerprint}`);

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
