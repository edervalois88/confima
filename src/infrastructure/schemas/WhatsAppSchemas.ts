import { z } from "zod";

/**
 * @fileoverview Esquemas de validación Zod para WhatsApp Cloud API.
 * Anillo 4: Infraestructura.
 */

export const WhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.string(),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            contacts: z.array(
              z.object({
                profile: z.object({
                  name: z.string(),
                }),
                wa_id: z.string(),
              })
            ).optional(),
            messages: z.array(
              z.object({
                from: z.string(),
                id: z.string(),
                timestamp: z.string(),
                type: z.enum(["text", "image", "document", "interactive"]),
                text: z.object({
                  body: z.string(),
                }).optional(),
                image: z.object({
                  id: z.string(),
                  mime_type: z.string(),
                  sha256: z.string(),
                }).optional(),
                document: z.object({
                  id: z.string(),
                  mime_type: z.string(),
                  sha256: z.string(),
                  filename: z.string(),
                }).optional(),
                interactive: z.object({
                  type: z.enum(["button_reply", "list_reply"]),
                  button_reply: z.object({
                    id: z.string(),
                    payload: z.string(), // El payload es lo que nos interesa para el ruteo
                    title: z.string(),
                  }).optional(),
                }).optional(),
              })
            ).optional(),
          }),
          field: z.string(),
        })
      ),
    })
  ),
});

export type WhatsAppWebhookPayload = z.infer<typeof WhatsAppWebhookSchema>;
