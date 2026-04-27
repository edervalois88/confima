import { z } from "zod";

/**
 * Esquemas de validación para las herramientas de los agentes.
 * Anillo 2: Aplicación.
 */

export const BudgetUpdateSchema = z.object({
  tenantId: z.string(),
  category: z.string(),
  newAmount: z.number().positive(),
  reason: z.string().optional()
});

export const VendorRecommendationSchema = z.object({
  category: z.string(),
  maxPrice: z.number().optional(),
  style: z.string().optional()
});

export const ContractAnalysisSchema = z.object({
  contractText: z.string(),
  extractFields: z.array(z.string()).default(["cancelationPolicy", "paymentSchedule", "deadlines"])
});
