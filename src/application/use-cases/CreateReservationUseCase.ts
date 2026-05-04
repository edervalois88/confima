import { Reservation } from '@/domain/entities/Reservation';
import { IReservationRepository } from '../ports/IReservationRepository';
import { ILLMService } from '../ports/ILLMService';
import { PredictionRiskService } from '@/domain/services/PredictionRiskService';
import { DomainError } from '@/domain/errors/DomainError';

/**
 * @fileoverview Caso de Uso: Orquestar la creación de una reserva con validación de riesgo.
 * Anillo 2: Orquestador determinista.
 */

export class CreateReservationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly llmService: ILLMService
  ) {}

  /**
   * Ejecuta el flujo de reserva con evaluación de overbooking.
   */
  public async execute(data: {
    customerId: string;
    temporalStartISO: string;
    partySize: number;
    weatherFactor?: number;
  }): Promise<Reservation> {
    
    // 1. Obtener contexto de ocupación actual
    const currentOccupancy = await this.reservationRepository.getOccupancyRate(data.temporalStartISO);
    
    // 2. Evaluar Riesgo en el Dominio (Pureza matemática)
    // Asumimos un no-show histórico base del 15% para este ejemplo.
    const riskEvaluation = PredictionRiskService.calculateOverbookingRisk(
      0.15, 
      currentOccupancy, 
      data.weatherFactor ?? 0
    );

    if (riskEvaluation.status === 'ABORT') {
      throw new DomainError("Capacidad máxima alcanzada y riesgo de colisión detectado. No se permite sobreventa.", "CAPACITY_EXCEEDED");
    }

    // 3. Crear entidad y persistir
    const reservation = Reservation.create({
      id: crypto.randomUUID(),
      customerId: data.customerId,
      temporalStartISO: data.temporalStartISO,
      partySize: data.partySize,
      status: 'PENDING',
      riskFactor: riskEvaluation.confidenceScore
    });

    await this.reservationRepository.save(reservation);

    return reservation;
  }
}
