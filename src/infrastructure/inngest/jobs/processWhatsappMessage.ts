import { InvitationConversationService } from "@/application/services/InvitationConversationService";
import { inngest } from "@/infrastructure/jobs/InngestClient";
import { LLMProviderFactory } from "@/application/services/LLMProviderFactory";
import { TenantResolutionService } from "@/application/services/TenantResolutionService";
import { WhatsAppCloudAdapter } from "@/infrastructure/adapters/WhatsAppCloudAdapter";
import { prisma } from "@/infrastructure/database/prisma";
import { z } from "zod";

const WhatsAppReceivedEventSchema = z.object({
  wamid: z.string(),
  phone: z.string(),
  guestName: z.string().optional(),
  text: z.string(),
  timestamp: z.string().optional(),
  wabaId: z.string(),
  phoneNumberId: z.string(),
});

export const processWhatsappMessage = inngest.createFunction(
  { id: "whatsapp-receiver", triggers: [{ event: "whatsapp/message.received" }] },
  async ({ event, step }) => {
    const { wamid, phone, guestName, text, wabaId, phoneNumberId } = WhatsAppReceivedEventSchema.parse(event.data);

    await step.run("log-telemetry", async () => {
      console.log(`🤖 [INNGEST] Procesando mensaje en background de: ${phone}`);
    });

    const conversationResult = await step.run("process-invitation-conversation", async () => {
      const tenantContext = await TenantResolutionService.resolveByWabaId(wabaId || phoneNumberId);
      if (!tenantContext) {
        throw new Error(`No tenant configured for WhatsApp business account ${wabaId}.`);
      }

      const llmService = LLMProviderFactory.getProvider();
      const service = new InvitationConversationService(prisma, llmService);
      return service.handle({
        tenantId: tenantContext.tenantId,
        wamid,
        phone,
        guestName,
        text,
      });
    });

    await step.run("send-whatsapp-reply", async () => {
      const messaging = new WhatsAppCloudAdapter();
      await messaging.sendMessage(phone, conversationResult.reply);
    });

    return { success: true, intent: conversationResult.intent };
  }
);
