import { z } from "zod";
import { MessageTemplate } from "@/domain/ports/IMessagingProvider";

const ComplianceGuestSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  phoneFingerprint: z.string(),
  messagingPaused: z.boolean(),
  whatsappOptInStatus: z.string(),
  serviceWindowExpiresAt: z.date().nullable(),
});

const ComplianceEventSchema = z.object({
  name: z.string(),
  hosts: z.string().nullable(),
  eventDate: z.date().nullable(),
  venueName: z.string().nullable(),
});

export type ComplianceGuest = z.infer<typeof ComplianceGuestSchema>;
export type ComplianceEvent = z.infer<typeof ComplianceEventSchema>;

export interface ComplianceDecision {
  allowed: boolean;
  status: "ALLOWED" | "BLOCKED" | "REQUIRES_TEMPLATE" | "REQUIRES_OPT_IN";
  reason: string;
}

export interface TemplateDefinition {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  sampleBody: string;
  requiredVariables: string[];
}

export const InvitationTemplateDefinition: TemplateDefinition = {
  name: process.env.WHATSAPP_INVITATION_TEMPLATE_NAME || "confirma_wedding_invitation_v1",
  category: "UTILITY",
  language: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "es_MX",
  requiredVariables: ["guest_name", "event_name", "hosts", "event_date", "venue_name"],
  sampleBody: [
    "Hola {{1}}, es un gusto informarte que has recibido una invitacion para {{2}} de {{3}}.",
    "El evento sera el {{4}} en {{5}}.",
    "Responde CONFIRMAR para confirmar asistencia, NO ASISTO si no podras asistir, o escribe tu pregunta.",
    "Si no deseas recibir mensajes de esta invitacion, responde STOP.",
  ].join(" "),
};

export class WhatsAppComplianceService {
  public static readonly serviceWindowHours = 24;

  public static assessTemplateSend(guestInput: ComplianceGuest): ComplianceDecision {
    const guest = ComplianceGuestSchema.parse(guestInput);

    if (guest.messagingPaused || guest.whatsappOptInStatus === "OPTED_OUT") {
      return {
        allowed: false,
        status: "BLOCKED",
        reason: "El invitado tiene opt-out o mensajeria pausada.",
      };
    }

    if (process.env.ENFORCE_WHATSAPP_OPT_IN === "false") {
      return {
        allowed: true,
        status: "ALLOWED",
        reason: "Opt-in no forzado por configuracion de entorno.",
      };
    }

    if (guest.whatsappOptInStatus !== "OBTAINED" && guest.whatsappOptInStatus !== "INBOUND_INITIATED") {
      return {
        allowed: false,
        status: "REQUIRES_OPT_IN",
        reason: "Falta consentimiento explicito para iniciar mensajes por WhatsApp.",
      };
    }

    return {
      allowed: true,
      status: "ALLOWED",
      reason: "Consentimiento valido y sin opt-out.",
    };
  }

  public static assessFreeFormReply(guestInput: ComplianceGuest, now = new Date()): ComplianceDecision {
    const guest = ComplianceGuestSchema.parse(guestInput);

    if (guest.messagingPaused || guest.whatsappOptInStatus === "OPTED_OUT") {
      return {
        allowed: false,
        status: "BLOCKED",
        reason: "El invitado solicito no recibir mas mensajes.",
      };
    }

    if (!guest.serviceWindowExpiresAt || guest.serviceWindowExpiresAt.getTime() <= now.getTime()) {
      return {
        allowed: false,
        status: "REQUIRES_TEMPLATE",
        reason: "La ventana de atencion de 24 horas no esta activa.",
      };
    }

    return {
      allowed: true,
      status: "ALLOWED",
      reason: "Respuesta dentro de la ventana de atencion de 24 horas.",
    };
  }

  public static getServiceWindowExpiration(now = new Date()): Date {
    return new Date(now.getTime() + WhatsAppComplianceService.serviceWindowHours * 60 * 60 * 1000);
  }

  public static isOptOutText(text: string): boolean {
    const normalized = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return /\b(stop|baja|cancelar|cancelame|no mensajes|no me escriban|salir|unsubscribe)\b/.test(normalized);
  }

  public static buildInvitationTemplate(
    guestInput: ComplianceGuest,
    eventInput: ComplianceEvent
  ): MessageTemplate {
    const guest = ComplianceGuestSchema.parse(guestInput);
    const event = ComplianceEventSchema.parse(eventInput);

    return {
      name: InvitationTemplateDefinition.name,
      language: InvitationTemplateDefinition.language,
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: guest.name || "invitado" },
            { type: "text", text: event.name },
            { type: "text", text: event.hosts || "los anfitriones" },
            { type: "text", text: formatEventDate(event.eventDate) },
            { type: "text", text: event.venueName || "sede por confirmar" },
          ],
        },
      ],
    };
  }
}

function formatEventDate(date: Date | null): string {
  if (!date) return "fecha por confirmar";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(date);
}
