import { z } from 'zod';
import { DomainValidationError } from '../errors/DomainError';

/**
 * @fileoverview Value Objects y esquemas de validación Zod para el Dominio.
 */

export const PhoneNumberSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, {
  message: "Formato de teléfono internacional inválido (E.164)."
});

export const PartySizeSchema = z.number().int().min(1).max(50);

export const ISO8601Schema = z.string().datetime();

/** Invariante de negocio: Rango temporal válido para una reserva. */
export const ReservationTimeSlotSchema = z.object({
  start: ISO8601Schema,
  end: ISO8601Schema
}).refine(data => new Date(data.start) < new Date(data.end), {
  message: "La fecha de inicio debe ser anterior a la de fin."
});

export type ReservationTimeSlot = z.infer<typeof ReservationTimeSlotSchema>;

/** Función auxiliar para validación imperativa con lanzamiento de DomainError. */
export function validateDomain<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new DomainValidationError(result.error.errors[0].message);
  }
  return result.data;
}
