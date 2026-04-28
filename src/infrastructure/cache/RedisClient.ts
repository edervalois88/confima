import { Redis } from '@upstash/redis';
import { logger } from '@/infrastructure/telemetry/logger';

/**
 * @fileoverview Cliente de Redis para ultra baja latencia.
 * Anillo 4: Infraestructura / Caché.
 */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

export class RedisCacheClient {
  public static isConfigured(): boolean {
    return redis !== null;
  }

  /**
   * Guarda un valor con un tiempo de vida (TTL) en segundos.
   */
  public static async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  }

  /**
   * Recupera un valor por su llave.
   */
  public static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    const data = await redis.get(key);
    if (!data) return null;
    return (typeof data === 'string' ? JSON.parse(data) : data) as T;
  }

  /**
   * Implementación de Idempotencia atómica.
   * Retorna true si la llave ya existía (duplicado).
   */
  public static async isDuplicate(key: string, ttlSeconds: number = 86400): Promise<boolean> {
    if (!redis) {
      logger.warn("Redis no configurado; idempotencia persistente desactivada.", {
        component: "RedisCacheClient",
        operation: "isDuplicate",
      });
      return false;
    }

    const exists = await redis.set(`idempotency:${key}`, "1", { nx: true, ex: ttlSeconds });
    return exists === null; // Si es null, es porque NO pudo setear (ya existía)
  }
}
