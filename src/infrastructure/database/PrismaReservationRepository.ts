import { PrismaClient } from '@prisma/client';
import { IReservationRepository } from '@/application/ports/IReservationRepository';
import { Reservation, ReservationStatus } from '@/domain/entities/Reservation';

/**
 * @fileoverview Implementación del repositorio de reservas usando Prisma.
 * Anillo 4: Adaptador de infraestructura.
 */
export class PrismaReservationRepository implements IReservationRepository {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async findById(id: string): Promise<Reservation | null> {
    const record = await this.prisma.reservationLog.findUnique({
      where: { id }
    });

    if (!record) return null;

    return Reservation.create({
      id: record.id,
      customerId: record.guestId,
      temporalStartISO: record.temporalStartISO.toISOString(),
      partySize: record.partySizeCapacity,
      status: record.statusState as ReservationStatus,
      riskFactor: record.riskFactorAexp
    });
  }

  public async save(reservation: Reservation): Promise<void> {
    await this.prisma.reservationLog.upsert({
      where: { id: reservation.id },
      update: {
        statusState: reservation.status,
        riskFactorAexp: reservation.riskFactor
      },
      create: {
        id: reservation.id,
        guestId: reservation.customerId,
        temporalStartISO: new Date(reservation.temporalStartISO),
        partySizeCapacity: reservation.partySize,
        statusState: reservation.status,
        riskFactorAexp: reservation.riskFactor
      }
    });
  }

  public async findByDate(dateISO: string): Promise<Reservation[]> {
    const startOfDay = new Date(dateISO);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateISO);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await this.prisma.reservationLog.findMany({
      where: {
        temporalStartISO: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    return records.map(record => Reservation.create({
      id: record.id,
      customerId: record.guestId,
      temporalStartISO: record.temporalStartISO.toISOString(),
      partySize: record.partySizeCapacity,
      status: record.statusState as ReservationStatus,
      riskFactor: record.riskFactorAexp
    }));
  }

  public async getOccupancyRate(dateISO: string): Promise<number> {
    // Implementación simplificada: contamos reservas activas vs capacidad teórica (e.g. 100)
    const count = await this.prisma.reservationLog.count({
      where: {
        temporalStartISO: new Date(dateISO),
        statusState: { in: ['CONFIRMED', 'PENDING'] }
      }
    });

    const MAX_CAPACITY = 100; // Podría venir de configuración por tienda
    return Math.min(1, count / MAX_CAPACITY);
  }
}
