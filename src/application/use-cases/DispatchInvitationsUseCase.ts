import { IMessagingProvider } from '@/domain/ports/IMessagingProvider';
import {
  InvitationTemplateDefinition,
  WhatsAppComplianceService,
} from '@/application/services/WhatsAppComplianceService';
import { prisma } from '@/infrastructure/database/prisma';
import { logger } from '@/infrastructure/telemetry/logger';
import { ProviderCommunicationError } from '@/domain/errors/InfrastructureError';

/**
 * @fileoverview Caso de Uso para el despacho masivo de invitaciones.
 * Anillo 2: Application.
 */

export interface DispatchInvitationsOptions {
  dryRun?: boolean;
  limit?: number;
}

export interface DispatchInvitationsResult {
  dryRun: boolean;
  totalCandidates: number;
  sent: number;
  blocked: number;
  failed: number;
  skipped: number;
  templateName: string;
  details: Array<{
    guestId: string;
    guestName: string;
    phone: string;
    status: "WOULD_SEND" | "SENT" | "BLOCKED" | "FAILED" | "SKIPPED";
    reason: string;
  }>;
}

export class DispatchInvitationsUseCase {
  constructor(private readonly messagingProvider: IMessagingProvider) {}

  public async execute(
    tenantId: string,
    templateName = InvitationTemplateDefinition.name,
    options: DispatchInvitationsOptions = {}
  ): Promise<DispatchInvitationsResult> {
    // 1. Obtener invitados pendientes de envío
    const guests = await prisma.guestProfile.findMany({
      where: { 
        tenantId,
        rsvpStatus: 'PENDING_SEND' 
      },
      include: { event: true },
      orderBy: { createdAt: "asc" },
      take: options.limit || 50,
    });

    logger.info("Iniciando despacho de invitaciones.", {
      component: "DispatchInvitationsUseCase",
      tenantId,
      total: guests.length,
      dryRun: options.dryRun === true,
    });

    const result: DispatchInvitationsResult = {
      dryRun: options.dryRun === true,
      totalCandidates: guests.length,
      sent: 0,
      blocked: 0,
      failed: 0,
      skipped: 0,
      templateName,
      details: [],
    };

    for (const guest of guests) {
      try {
        const complianceDecision = WhatsAppComplianceService.assessTemplateSend(guest);
        const guestLabel = guest.name || "Invitado sin nombre";

        if (!guest.event) {
          result.blocked += 1;
          result.details.push({
            guestId: guest.id,
            guestName: guestLabel,
            phone: guest.phoneFingerprint,
            status: "BLOCKED",
            reason: "El invitado no tiene evento asociado.",
          });
          if (!options.dryRun) {
            await this.auditBlockedInvitation({
              guestId: guest.id,
              eventId: null,
              templateName,
              status: "BLOCKED",
              reason: "El invitado no tiene evento asociado.",
            });
          }
          continue;
        }

        if (!complianceDecision.allowed) {
          result.blocked += 1;
          result.details.push({
            guestId: guest.id,
            guestName: guestLabel,
            phone: guest.phoneFingerprint,
            status: "BLOCKED",
            reason: complianceDecision.reason,
          });
          if (!options.dryRun) {
            await this.auditBlockedInvitation({
              guestId: guest.id,
              eventId: guest.event.id,
              templateName,
              status: complianceDecision.status,
              reason: complianceDecision.reason,
            });
          }
          continue;
        }

        if (options.dryRun) {
          result.skipped += 1;
          result.details.push({
            guestId: guest.id,
            guestName: guestLabel,
            phone: guest.phoneFingerprint,
            status: "WOULD_SEND",
            reason: "Cumple opt-in y usaria plantilla aprobada.",
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
        result.sent += 1;
        result.details.push({
          guestId: guest.id,
          guestName: guestLabel,
          phone: guest.phoneFingerprint,
          status: "SENT",
          reason: providerMessageId || "Mensaje aceptado por el proveedor.",
        });

      } catch (error) {
        logger.warn("Fallo al enviar invitacion.", {
          component: "DispatchInvitationsUseCase",
          tenantId,
          guestId: guest.id,
          eventId: guest.eventId,
          status: error instanceof ProviderCommunicationError ? error.status : "unknown",
          code: error instanceof ProviderCommunicationError ? error.providerCode : "unknown",
        });
        result.failed += 1;
        const reason = toDispatchErrorReason(error);
        result.details.push({
          guestId: guest.id,
          guestName: guest.name || "Invitado sin nombre",
          phone: guest.phoneFingerprint,
          status: "FAILED",
          reason,
        });

        if (guest.eventId && !options.dryRun) {
          await prisma.invitation.create({
            data: {
              eventId: guest.eventId,
              guestId: guest.id,
              templateName,
              templateCategory: InvitationTemplateDefinition.category,
              status: "FAILED",
              complianceStatus: "ALLOWED",
              complianceReason: reason,
            },
          });
        }

        if (isGlobalDispatchBlocker(error)) {
          const remainingGuests = guests.slice(guests.indexOf(guest) + 1);
          result.skipped += remainingGuests.length;

          for (const remainingGuest of remainingGuests) {
            result.details.push({
              guestId: remainingGuest.id,
              guestName: remainingGuest.name || "Invitado sin nombre",
              phone: remainingGuest.phoneFingerprint,
              status: "SKIPPED",
              reason: "Despacho detenido por error global de autenticacion/configuracion.",
            });
          }

          break;
        }
      }
    }

    return result;
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

function isGlobalDispatchBlocker(error: unknown): boolean {
  return error instanceof ProviderCommunicationError && (error.status === 401 || error.providerCode === 190);
}

function toDispatchErrorReason(error: unknown): string {
  if (error instanceof ProviderCommunicationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message.slice(0, 240);
  }

  return "Error desconocido durante el envio.";
}
