import { Reservation } from '@/domain/entities/Reservation';

/**
 * @fileoverview Puerto (Interface) para el acceso a datos de reservas.
 * Anillo 2: Abstracción que la infraestructura debe implementar.
 */
export interface IReservationRepository {
  /** Busca una reserva por su identificador único. */
  findById(id: string): Promise<Reservation | null>;
  
  /** Persiste o actualiza una reserva en el almacenamiento. */
  save(reservation: Reservation): Promise<void>;
  
  /** Obtiene las reservas activas para una fecha específica. */
  findByDate(dateISO: string): Promise<Reservation[]>;
  
  /** Calcula el porcentaje de ocupación actual para una ventana temporal. */
  getOccupancyRate(dateISO: string): Promise<number>;
}
