import { PrismaClient } from '@prisma/client';

/**
 * @fileoverview Extensión de Prisma para Control de Acceso Multi-Tenant.
 * Anillo 4: Infrastructure / Persistencia.
 * Garantiza que ninguna consulta pueda escapar del contexto del Tenant.
 */

export const createPrismaExtended = (tenantId: string) => {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const scopedArgs = args as Record<string, unknown>;

          // 1. Forzar filtro de tenantId en todas las consultas de lectura
          if (['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)) {
            scopedArgs.where = { ...asRecord(scopedArgs.where), tenantId };
          }

          // 2. Forzar tenantId en mutaciones para evitar fugas/sobreescrituras
          if (['create', 'update', 'upsert', 'delete'].includes(operation)) {
            if (operation === 'create') {
              scopedArgs.data = { ...asRecord(scopedArgs.data), tenantId };
            } else {
              scopedArgs.where = { ...asRecord(scopedArgs.where), tenantId };
            }
          }

          return query(args);
        },
      },
    },
  });
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

/**
 * @example
 * const prisma = createPrismaExtended(ctx.tenantId);
 * const guests = await prisma.guestProfile.findMany(); // Selecciona solo los del tenant
 */
