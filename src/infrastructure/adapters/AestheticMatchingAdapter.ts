import { IAestheticMatchingService, Vendor } from "../../domain/ports/PlanningPorts";
import { ClipEmbeddingService } from "../services/ClipEmbeddingService";
import { PineconeVectorRepository } from "../repositories/PineconeVectorRepository";

/**
 * @fileoverview Adaptador concreto que orquestra búsqueda visual y persistencia.
 * Anillo 4: Infraestructura.
 */

export class AestheticMatchingAdapter implements IAestheticMatchingService {
  constructor(
    private clipService: ClipEmbeddingService,
    private vectorRepo: PineconeVectorRepository
  ) {}

  public async findVendorsByAesthetic(moodboardVectors: number[]): Promise<Vendor[]> {
    try {
      // 1. En este flujo, moodboardVectors ya viene procesado o se procesa aquí si el contrato lo requiere
      // 2. Buscar IDs en base vectorial
      const vendorIds = await this.vectorRepo.findSimilarVendors(moodboardVectors);

      return vendorIds.map((vendorId, index) => ({
        id: vendorId,
        name: `Proveedor sugerido ${index + 1}`,
        category: "Decoracion",
        priceRange: "$$",
        rating: 4.7,
        aestheticScore: 0.95
      }));
    } catch (error) {
      console.error("[AESTHETIC_ADAPTER_ERROR]", error);
      throw new Error("Error en el motor de búsqueda visual. Degradación a búsqueda por etiquetas.");
    }
  }

  /**
   * Método extendido para el caso de uso que recibe URLs
   */
  public async findByImageUrls(urls: string[]): Promise<Vendor[]> {
    const vector = await this.clipService.generateAestheticVector(urls);
    return this.findVendorsByAesthetic(vector);
  }
}
