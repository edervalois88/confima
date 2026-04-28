import { RedisCacheClient } from '@/infrastructure/cache/RedisClient';
import { prisma } from '@/infrastructure/database/prisma';

/**
 * @fileoverview Servicio de Resolución de Contexto Multi-Tenant con Caché Redis.
 * Anillo 2: Application.
 */

export interface TenantContext {
  tenantId: string;
  subscription: {
    canUploadExcel: boolean;
    hasWeatherConcierge: boolean;
    hasMapLogistics: boolean;
  };
}

export class TenantResolutionService {
  /**
   * Mapea un WABA ID a un Tenant usando patrón Cache-Aside.
   */
  public static async resolveByWabaId(wabaId: string): Promise<TenantContext | null> {
    const cacheKey = `tenant_ctx:${wabaId}`;
    
    // 1. Check Redis (L1)
    const cached = await RedisCacheClient.get<TenantContext>(cacheKey);
    if (cached) return cached;

    // 2. Query Prisma (L2)
    const tenant = await prisma.tenant.findFirst({
      // Simulación: En producción buscaría por WABA ID configurado
      include: { subscription: true }
    });

    if (!tenant || !tenant.subscription) return null;

    const context: TenantContext = {
      tenantId: tenant.id,
      subscription: {
        canUploadExcel: tenant.subscription.canUploadExcel,
        hasWeatherConcierge: tenant.subscription.hasWeatherConcierge,
        hasMapLogistics: tenant.subscription.hasMapLogistics
      }
    };

    // 3. Fill Cache
    await RedisCacheClient.set(cacheKey, context, 3600);
    return context;
  }

  /**
   * Garantiza que el mensaje no haya sido procesado previamente.
   */
  public static async isMessageDuplicate(messageId: string): Promise<boolean> {
    return await RedisCacheClient.isDuplicate(messageId);
  }
}
