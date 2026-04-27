import { validateDomain, PartySizeSchema, ISO8601Schema } from '../value-objects/schemas';

/**
 * @fileoverview Entidad Pura de Reserva.
 * Representa el contrato inmutable de una reserva en el dominio.
 */

export type ReservationStatus = 'CONFIRMED' | 'NO_SHOW' | 'AT_TABLE' | 'CANCELLED' | 'PENDING';

export interface ReservationProps {
  id: string;
  customerId: string;
  temporalStartISO: string;
  partySize: number;
  status: ReservationStatus;
  riskFactor: number;
}

export class Reservation {
  private constructor(private readonly props: ReservationProps) {}

  /**
   * Factory Method para asegurar que toda reserva creada cumple con las invariantes de dominio.
   */
  public static create(props: ReservationProps): Reservation {
    validateDomain(ISO8601Schema, props.temporalStartISO);
    validateDomain(PartySizeSchema, props.partySize);
    
    return new Reservation({
      ...props,
      riskFactor: props.riskFactor ?? 0.0
    });
  }

  public get id() { return this.props.id; }
  public get customerId() { return this.props.customerId; }
  public get temporalStartISO() { return this.props.temporalStartISO; }
  public get partySize() { return this.props.partySize; }
  public get status() { return this.props.status; }
  public get riskFactor() { return this.props.riskFactor; }

  /**
   * Cambia el estado de la reserva cumpliendo reglas de transición.
   */
  public markAsArrived(): Reservation {
    return new Reservation({ ...this.props, status: 'AT_TABLE' });
  }

  public markAsNoShow(): Reservation {
    return new Reservation({ ...this.props, status: 'NO_SHOW' });
  }
}
