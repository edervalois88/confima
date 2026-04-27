import { Redis } from '@upstash/redis';

/**
 * @fileoverview Cliente de Redis para ultra baja latencia.
 * Anillo 4: Infraestructura / Caché.
 */

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export class RedisCacheClient {
  /**
   * Guarda un valor con un tiempo de vida (TTL) en segundos.
   */
  public static async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  }

  /**
   * Recupera un valor por su llave.
   */
  public static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return (typeof data === 'string' ? JSON.parse(data) : data) as T;
  }

  /**
   * Implementación de Idempotencia atómica.
   * Retorna true si la llave ya existía (duplicado).
   */
  public static async isDuplicate(key: string, ttlSeconds: number = 86400): Promise<boolean> {
    const exists = await redis.set(`idempotency:${key}`, "1", { nx: true, ex: ttlSeconds });
    return exists === null; // Si es null, es porque NO pudo setear (ya existía)
  }
}
