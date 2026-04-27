import { NextResponse } from "next/server";
import { z } from "zod";
import { HandleExternalContingencyUseCase } from "@/application/use-cases/HandleExternalContingencyUseCase";
import { WeddingPlanningOrchestrator } from "@/application/use-cases/WeddingPlanningOrchestrator";

/**
 * @fileoverview Endpoint de Webhook para alertas de contingencia externas.
 * Anillo 3: Presentation (API).
 */

const ContingencyEventSchema = z.object({
  tenantId: z.string().uuid(),
  contingencyType: z.enum(["WEATHER", "VENDOR_DELAY", "LOGISTICS_ISSUE"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  description: z.string(),
  metadata: z.record(z.any()).optional()
});

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
    const orchestrator = new WeddingPlanningOrchestrator(null as any, null as any); 
    const useCase = new HandleExternalContingencyUseCase(orchestrator);

    await useCase.execute(validation.data);

    return NextResponse.json({ status: "CONTINGENCY_ORCHESTRATED" });
  } catch (error: any) {
    console.error("[CONTINGENCY_WEBHOOK_ERROR]", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
