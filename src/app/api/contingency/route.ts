import { NextResponse } from "next/server";
import { z } from "zod";
import { HandleExternalContingencyUseCase } from "@/application/use-cases/HandleExternalContingencyUseCase";
import { WeddingPlanningOrchestrator } from "@/application/use-cases/WeddingPlanningOrchestrator";
import { BudgetAllocation, IBudgetOptimizationService, IVendorRepository, Vendor } from "@/domain/ports/PlanningPorts";
import { logger } from "@/infrastructure/telemetry/logger";

/**
 * @fileoverview Endpoint de Webhook para alertas de contingencia externas.
 * Anillo 3: Presentation (API).
 */

const ContingencyEventSchema = z.object({
  tenantId: z.string().uuid(),
  contingencyType: z.enum(["WEATHER", "VENDOR_DELAY", "LOGISTICS_ISSUE"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  description: z.string(),
  metadata: z.record(z.unknown()).optional()
});

const contingencyBudgetService: IBudgetOptimizationService = {
  async calculateOptimalAllocation(): Promise<BudgetAllocation[]> {
    return [];
  },
  async updateAllocation(): Promise<void> {
    return;
  },
};

const contingencyVendorRepository: IVendorRepository = {
  async searchVendors(): Promise<Vendor[]> {
    return [];
  },
  async getContractText(): Promise<string> {
    return "";
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validación Estricta con Zod (Tolerancia Cero a 'any')
    const validation = ContingencyEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    // 2. Orquestar Contingencia (Anillo 2)
    // Nota: El orquestador se inyectaría vía DI en una arquitectura completa de NestJS.
    // Aquí inicializamos manualmente para la demo de Next.js.
    const orchestrator = new WeddingPlanningOrchestrator(
      contingencyBudgetService,
      contingencyVendorRepository
    );
    const useCase = new HandleExternalContingencyUseCase(orchestrator);

    await useCase.execute(validation.data);

    return NextResponse.json({ status: "CONTINGENCY_ORCHESTRATED" });
  } catch (error) {
    logger.error("Error procesando webhook de contingencia.", {
      component: "ContingencyRoute",
      operation: "POST",
      errorMessage: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
