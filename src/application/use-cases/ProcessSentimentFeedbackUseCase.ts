import { ISentimentAnalysisService, IVendorRatingService } from "../../domain/ports/PlanningPorts";

/**
 * @fileoverview Caso de Uso para procesar feedback de invitados y actualizar reputación.
 * Anillo 2: Aplicación.
 */

export class ProcessSentimentFeedbackUseCase {
  constructor(
    private readonly sentimentService: ISentimentAnalysisService,
    private readonly ratingService: IVendorRatingService
  ) {}

  public async execute(text: string, vendorId: string): Promise<void> {
    console.log(`[PROCESS_FEEDBACK] Procesando comentario para el proveedor: \${vendorId}`);

    // 1. Análisis de Sentimiento Semántico
    const result = await this.sentimentService.analyze(text);

    // 2. Actualización de Memoria (Rating del Proveedor)
    // El delta se calcula basándose en el score y el sentimiento
    if (result.sentiment !== "NEUTRAL") {
      await this.ratingService.updateRating(vendorId, result);
    }

    console.log(`[PROCESS_FEEDBACK] Ciclo de aprendizaje completado para \${vendorId}`);
  }
}
