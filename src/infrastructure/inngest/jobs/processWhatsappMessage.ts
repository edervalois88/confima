import { PrismaClient } from "@prisma/client";
import { InvitationConversationService } from "@/application/services/InvitationConversationService";
import { inngest } from "@/infrastructure/jobs/InngestClient";
import { LLMProviderFactory } from "@/application/services/LLMProviderFactory";
import { WhatsAppCloudAdapter } from "@/infrastructure/adapters/WhatsAppCloudAdapter";

const prisma = new PrismaClient();

export const processWhatsappMessage = inngest.createFunction(
  { id: "whatsapp-receiver", triggers: [{ event: "whatsapp/message.received" }] },
  async ({ event, step }) => {
    const { wamid, phone, guestName, text } = event.data;

    await step.run("log-telemetry", async () => {
      console.log(`🤖 [INNGEST] Procesando mensaje en background de: ${phone}`);
    });

    const conversationResult = await step.run("process-invitation-conversation", async () => {
      const llmService = LLMProviderFactory.getProvider();
      const service = new InvitationConversationService(prisma, llmService);
      return service.handle({
        tenantId: "default-tenant",
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
