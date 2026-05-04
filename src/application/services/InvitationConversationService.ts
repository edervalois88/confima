import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ConversationMessage, ILLMService } from "@/application/ports/ILLMService";
import { WhatsAppComplianceService } from "@/application/services/WhatsAppComplianceService";
import { DomainError } from "@/domain/errors/DomainError";

const IncomingConversationSchema = z.object({
  tenantId: z.string(),
  wamid: z.string(),
  phone: z.string(),
  guestName: z.string().optional(),
  text: z.string(),
});

export type IncomingConversation = z.infer<typeof IncomingConversationSchema>;

export interface ConversationResult {
  reply: string;
  intent: GuestIntent;
  guestId?: string;
}

type GuestIntent = "CONFIRM" | "DECLINE" | "SPECIAL_NEED" | "QUESTION" | "UNKNOWN" | "OPT_OUT";

interface StrictContext {
  facts: Array<{ key: string; value: string; category: string }>;
  faqs: Array<{ question: string; answer: string; category: string }>;
}

export class InvitationConversationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly llmService: ILLMService
  ) {}

  public async handle(input: IncomingConversation): Promise<ConversationResult> {
    const parsed = IncomingConversationSchema.parse(input);
    const tenant = await this.ensureTenant(parsed.tenantId);
    const serviceWindowExpiresAt = WhatsAppComplianceService.getServiceWindowExpiration();
    const guest = await this.ensureGuest({
      tenantId: tenant.id,
      phone: parsed.phone,
      guestName: parsed.guestName,
    });

    if (WhatsAppComplianceService.isOptOutText(parsed.text)) {
      await this.prisma.guestProfile.update({
        where: { id: guest.id },
        data: {
          messagingPaused: true,
          whatsappOptInStatus: "OPTED_OUT",
          whatsappOptOutAt: new Date(),
          serviceWindowOpenedAt: new Date(),
          serviceWindowExpiresAt,
          lastInboundAt: new Date(),
        },
      });

      const reply = "Listo, pausamos los mensajes de esta invitacion. Si quieres reactivar la conversacion, contacta directamente a los anfitriones.";

      await this.prisma.messageLog.create({
        data: {
          tenantId: tenant.id,
          eventId: guest.eventId,
          guestId: guest.id,
          wamid: parsed.wamid,
          direction: "INBOUND",
          body: parsed.text,
          intent: "OPT_OUT",
          messageType: "FREE_FORM",
          complianceStatus: "ALLOWED",
          complianceReason: "Solicitud de opt-out recibida por WhatsApp.",
        },
      }).catch(() => undefined);

      await this.prisma.messageLog.create({
        data: {
          tenantId: tenant.id,
          eventId: guest.eventId,
          guestId: guest.id,
          direction: "OUTBOUND",
          body: reply,
          intent: "OPT_OUT",
          messageType: "FREE_FORM",
          complianceStatus: "ALLOWED",
          complianceReason: "Confirmacion transaccional de opt-out dentro de la conversacion.",
        },
      });

      return { reply, intent: "OPT_OUT", guestId: guest.id };
    }

    const activeGuest = await this.prisma.guestProfile.update({
      where: { id: guest.id },
      data: {
        serviceWindowOpenedAt: new Date(),
        serviceWindowExpiresAt,
        lastInboundAt: new Date(),
        whatsappOptInStatus: guest.whatsappOptInStatus === "UNKNOWN" ? "INBOUND_INITIATED" : guest.whatsappOptInStatus,
        whatsappOptInSource: guest.whatsappOptInStatus === "UNKNOWN" ? "WHATSAPP_INBOUND" : guest.whatsappOptInSource,
        whatsappOptInAt: guest.whatsappOptInAt || new Date(),
      },
    });

    const intent = classifyDeterministicIntent(parsed.text);

    await this.prisma.messageLog.create({
      data: {
        tenantId: tenant.id,
        eventId: activeGuest.eventId,
        guestId: activeGuest.id,
        wamid: parsed.wamid,
        direction: "INBOUND",
        body: parsed.text,
        intent,
        messageType: "FREE_FORM",
        complianceStatus: "ALLOWED",
        complianceReason: "Mensaje iniciado por invitado; abre ventana de atencion.",
      },
    }).catch(() => undefined);

    const result = await this.resolveIntent({
      tenantId: tenant.id,
      eventId: activeGuest.eventId,
      guestId: activeGuest.id,
      text: parsed.text,
      intent,
    });

    const replyDecision = WhatsAppComplianceService.assessFreeFormReply(activeGuest);

    await this.prisma.messageLog.create({
      data: {
        tenantId: tenant.id,
        eventId: activeGuest.eventId,
        guestId: activeGuest.id,
        direction: "OUTBOUND",
        body: result.reply,
        intent: result.intent,
        messageType: "FREE_FORM",
        complianceStatus: replyDecision.status,
        complianceReason: replyDecision.reason,
      },
    });

    if (!replyDecision.allowed) {
      return {
        intent: "UNKNOWN",
        reply: "Recibimos tu mensaje. Para continuar por WhatsApp necesitamos reabrir la conversacion con una plantilla autorizada.",
        guestId: activeGuest.id,
      };
    }

    return { ...result, guestId: activeGuest.id };
  }

  private async resolveIntent(input: {
    tenantId: string;
    eventId: string | null;
    guestId: string;
    text: string;
    intent: GuestIntent;
  }): Promise<ConversationResult> {
    if (input.intent === "CONFIRM") {
      await this.prisma.guestProfile.update({
        where: { id: input.guestId },
        data: { rsvpStatus: "CONFIRMED", lastInboundAt: new Date() },
      });

      return {
        intent: "CONFIRM",
        reply: "Gracias, tu asistencia queda confirmada. Si tienes alguna necesidad especial, puedes responderme por este medio.",
      };
    }

    if (input.intent === "DECLINE") {
      await this.prisma.guestProfile.update({
        where: { id: input.guestId },
        data: { rsvpStatus: "DECLINED", lastInboundAt: new Date() },
      });

      return {
        intent: "DECLINE",
        reply: "Gracias por avisarnos. Registramos que no podras asistir.",
      };
    }

    if (input.intent === "SPECIAL_NEED") {
      await this.prisma.guestProfile.update({
        where: { id: input.guestId },
        data: {
          rsvpStatus: "CONFIRMED",
          specialNeeds: input.text.slice(0, 500),
          dietaryRestrictions: input.text.slice(0, 500),
          lastInboundAt: new Date(),
        },
      });

      return {
        intent: "SPECIAL_NEED",
        reply: "Gracias, ya registramos tu necesidad especial para que los anfitriones la revisen.",
      };
    }

    const context = input.eventId
      ? await this.retrieveStrictContext(input.eventId, input.text)
      : { facts: [], faqs: [] };

    if (context.facts.length === 0 && context.faqs.length === 0) {
      return {
        intent: "UNKNOWN",
        reply: "No tengo ese dato confirmado por ahora. Lo dejo marcado para que los anfitriones puedan revisarlo.",
      };
    }

    return {
      intent: "QUESTION",
      reply: await this.answerWithStrictContext(input.text, context),
    };
  }

  private async retrieveStrictContext(eventId: string, text: string): Promise<StrictContext> {
    const keywords = extractKeywords(text);

    const [facts, faqs] = await Promise.all([
      this.prisma.eventFact.findMany({
        where: {
          eventId,
          visibility: "GUEST",
          OR: keywords.flatMap(keyword => [
            { key: { contains: keyword, mode: "insensitive" as const } },
            { category: { contains: keyword, mode: "insensitive" as const } },
            { value: { contains: keyword, mode: "insensitive" as const } },
          ]),
        },
        take: 6,
      }),
      this.prisma.eventFAQ.findMany({
        where: {
          eventId,
          active: true,
          OR: keywords.flatMap(keyword => [
            { question: { contains: keyword, mode: "insensitive" as const } },
            { answer: { contains: keyword, mode: "insensitive" as const } },
            { category: { contains: keyword, mode: "insensitive" as const } },
          ]),
        },
        take: 4,
      }),
    ]);

    return {
      facts: facts.map(fact => ({ key: fact.key, value: fact.value, category: fact.category })),
      faqs: faqs.map(faq => ({ question: faq.question, answer: faq.answer, category: faq.category })),
    };
  }

  private async answerWithStrictContext(question: string, context: StrictContext): Promise<string> {
    const systemContext = [
      "Eres el asistente de confirmacion de una boda.",
      "Responde en espanol, breve, amable y sin inventar.",
      "Usa exclusivamente los facts y FAQs proporcionados.",
      "Si el contexto no contiene la respuesta, di que no tienes ese dato confirmado.",
    ].join(" ");

    const history: ConversationMessage[] = [{
      role: "user",
      content: JSON.stringify({
        question,
        facts: context.facts,
        faqs: context.faqs,
      }),
    }];

    return this.llmService.processIntent(systemContext, history);
  }

  private async ensureTenant(tenantId: string) {
    const existing = await this.prisma.tenant.findFirst({ where: { id: tenantId } }).catch(() => null);
    if (existing) return existing;

    throw new DomainError(`Tenant ${tenantId} no existe o no esta configurado para esta conversacion.`, "TENANT_NOT_FOUND");
  }

  private async ensureGuest(input: { tenantId: string; phone: string; guestName?: string }) {
    const existing = await this.prisma.guestProfile.findUnique({
      where: {
        tenantId_phoneFingerprint: {
          tenantId: input.tenantId,
          phoneFingerprint: input.phone,
        },
      },
    });

    if (existing) return existing;

    return this.prisma.guestProfile.create({
      data: {
        tenantId: input.tenantId,
        name: input.guestName,
        phoneFingerprint: input.phone,
        contactSource: "WHATSAPP",
        rsvpStatus: "PENDING_SEND",
      },
    });
  }
}

function classifyDeterministicIntent(text: string): GuestIntent {
  const normalized = normalize(text);

  if (/\b(si|sí|confirmo|confirmamos|asisto|asistimos|voy|vamos|ahi estaremos|all[ií] estaremos)\b/.test(normalized)) {
    return "CONFIRM";
  }

  if (/\b(no voy|no iremos|no podre|no podr[eé]|declino|cancelar|no asisto|no asistiremos)\b/.test(normalized)) {
    return "DECLINE";
  }

  if (/\b(alergia|alergico|al[eé]rgico|vegano|vegetariano|sin gluten|diabet|silla de ruedas|accesibilidad|embarazada|menu especial|men[uú] especial)\b/.test(normalized)) {
    return "SPECIAL_NEED";
  }

  if (normalized.includes("?") || /\b(donde|d[oó]nde|cuando|cu[aá]ndo|hora|ubicacion|ubicaci[oó]n|direccion|direcci[oó]n|vestimenta|dress code|regalo|mesa de regalos|hotel|transporte|ninos|niños)\b/.test(normalized)) {
    return "QUESTION";
  }

  return "UNKNOWN";
}

function extractKeywords(text: string): string[] {
  const normalized = normalize(text);
  const words = normalized
    .split(/[^a-z0-9áéíóúñ]+/i)
    .map(word => word.trim())
    .filter(word => word.length >= 4);

  return [...new Set(words)].slice(0, 8);
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
