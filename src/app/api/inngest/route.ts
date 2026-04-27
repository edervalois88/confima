import { serve } from "inngest/next";
import { inngest } from "../../../infrastructure/jobs/InngestClient";
import { proactiveConciergeFunc } from "../../../infrastructure/jobs/weddingJobs";
import { processWhatsappMessage } from "../../../infrastructure/inngest/jobs/processWhatsappMessage";

/**
 * @fileoverview Route Handler para Inngest en Next.js 16.
 */

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processWhatsappMessage,
    proactiveConciergeFunc,
  ],
});
