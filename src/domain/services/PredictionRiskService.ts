import { DomainError } from '@/domain/errors/DomainError';

/**
 * @fileoverview Servicio de Dominio para el cálculo de riesgo predictivo.
 * Anillo 1: Pureza matemática libre de dependencias externas.
 */

export class RiskCalculationError extends DomainError {
  constructor(message: string) {
    super(message, 'RISK_CALCULATION_ERROR');
    this.name = 'RiskCalculationError';
  }
}

export interface RiskEvaluationResult {
  status: 'COMMIT_OVERBOOKING' | 'ABORT';
  confidenceScore: number;
}

export class PredictionRiskService {
  /**
   * Evalúa la viabilidad de permitir sobreventa basado en probabilidad estadística.
   * Algoritmo: f(noShow, occupancy, weather) = RiskFactor
   * 
   * @param historicalNoShowRate Probabilidad histórica de inasistencia (0-1)
   * @param currentOccupancyPercent Porcentaje de ocupación actual (0-1)
   * @param weatherFactor Factor de clima (-1 a 1, donde -1 es clima extremo negativo)
   */
  public static calculateOverbookingRisk(
    historicalNoShowRate: number,
    currentOccupancyPercent: number,
    weatherFactor: number = 0
  ): RiskEvaluationResult {
    
    if (historicalNoShowRate < 0 || historicalNoShowRate > 1) {
      throw new RiskCalculationError("Historical No-Show rate must be between 0 and 1.");
    }

    // Calculamos el riesgo ajustado (Aexp)
    // Aumentamos el riesgo si el clima es malo (lluvia/tormenta reduce asistencia)
    const adjustedNoShowProb = historicalNoShowRate + (Math.abs(Math.min(0, weatherFactor)) * 0.2);
    
    // Si la ocupación es menor al 90%, el riesgo es bajo por definición
    if (currentOccupancyPercent < 0.9) {
      return { status: 'COMMIT_OVERBOOKING', confidenceScore: 1.0 };
    }

    // Umbral crítico: Si la probabilidad de inasistencia > 0.3 en ocupación llena (1.0),
    // permitimos overbooking preventivo.
    const riskThreshold = 1.0 - adjustedNoShowProb;

    if (currentOccupancyPercent > riskThreshold) {
       // Si estamos por encima del umbral de riesgo, abortamos para evitar colisiones
       return { status: 'ABORT', confidenceScore: adjustedNoShowProb };
    }

    return { status: 'COMMIT_OVERBOOKING', confidenceScore: adjustedNoShowProb };
  }
}
