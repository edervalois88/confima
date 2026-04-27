import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const GuestDirectoryRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  partySize: z.number(),
  rsvpStatus: z.string(),
  specialNeed: z.string().optional(),
  eventName: z.string().optional(),
  optInStatus: z.string(),
  messagingPaused: z.boolean(),
});

export type GuestDirectoryRow = z.infer<typeof GuestDirectoryRowSchema>;

export interface RsvpSummary {
  confirmed: number;
  pending: number;
  specialNeeds: number;
}

export class GuestDirectoryService {
  constructor(private readonly prisma: PrismaClient) {}

  public async listGuests(limit = 200): Promise<GuestDirectoryRow[]> {
    const guests = await this.prisma.guestProfile.findMany({
      include: {
        event: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { event: { name: "asc" } },
        { name: "asc" },
        { createdAt: "asc" },
      ],
      take: limit,
    });

    return guests.map(guest => GuestDirectoryRowSchema.parse({
      id: guest.id,
      name: guest.name || "Invitado sin nombre",
      phone: formatPhone(guest.phoneFingerprint),
      partySize: guest.partySize,
      rsvpStatus: guest.rsvpStatus,
      specialNeed: guest.specialNeeds || guest.dietaryRestrictions || undefined,
      eventName: guest.event?.name,
      optInStatus: guest.whatsappOptInStatus,
      messagingPaused: guest.messagingPaused,
    }));
  }

  public async getSummary(): Promise<RsvpSummary> {
    const [confirmed, pending, specialNeeds] = await Promise.all([
      this.prisma.guestProfile.count({ where: { rsvpStatus: "CONFIRMED" } }),
      this.prisma.guestProfile.count({
        where: {
          rsvpStatus: {
            in: ["PENDING_SEND", "DELIVERED", "READ"],
          },
        },
      }),
      this.prisma.guestProfile.count({
        where: {
          OR: [
            { specialNeeds: { not: null } },
            { dietaryRestrictions: { not: null } },
          ],
        },
      }),
    ]);

    return { confirmed, pending, specialNeeds };
  }
}

function formatPhone(phone: string): string {
  if (phone.startsWith("+")) return phone;
  return `+${phone}`;
}
