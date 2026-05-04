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
    return this.resolveByWhatsAppIdentifiers({ wabaId });
  }

  /**
   * Mapea identificadores de WhatsApp Cloud a un Tenant usando Cache-Aside.
   */
  public static async resolveByWhatsAppIdentifiers(input: {
    wabaId?: string;
    phoneNumberId?: string;
  }): Promise<TenantContext | null> {
    const identifiers = [input.wabaId, input.phoneNumberId].filter(isPresent);
    if (identifiers.length === 0) return null;

    const cacheKey = `tenant_ctx:${identifiers.join(":")}`;
    
    // 1. Check Redis (L1)
    const cached = await RedisCacheClient.get<TenantContext>(cacheKey);
    if (cached) return cached;

    // 2. Query Prisma (L2)
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          input.wabaId ? { whatsappBusinessAccountId: input.wabaId } : undefined,
          input.phoneNumberId ? { whatsappPhoneNumberId: input.phoneNumberId } : undefined,
        ].filter(isPresent),
      },
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
    await Promise.all(
      identifiers.map((identifier) => RedisCacheClient.set(`tenant_ctx:${identifier}`, context, 3600))
    );
    return context;
  }

  /**
   * Garantiza que el mensaje no haya sido procesado previamente.
   */
  public static async isMessageDuplicate(messageId: string): Promise<boolean> {
    return await RedisCacheClient.isDuplicate(messageId);
  }
}

function isPresent<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null && value !== "";
}
