import { Redis } from '@upstash/redis';
import { createClient } from 'redis';
import { logger } from '@/infrastructure/telemetry/logger';

/**
 * @fileoverview Cliente de Redis para ultra baja latencia.
 * Anillo 4: Infraestructura / Caché.
 */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisTcpUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_REDIS_URL;

export const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

const tcpRedis = !redis && redisTcpUrl
  ? createClient({ url: redisTcpUrl })
  : null;

let tcpRedisConnection: Promise<NonNullable<typeof tcpRedis>> | null = null;

async function getTcpRedisClient(): Promise<NonNullable<typeof tcpRedis> | null> {
  if (!tcpRedis) return null;

  if (!tcpRedisConnection) {
    tcpRedis.on('error', (error: Error) => {
      logger.error("Error de Redis TCP.", {
        component: "RedisCacheClient",
        operation: "tcpRedis.error",
        errorMessage: error.message,
      });
    });

    tcpRedisConnection = tcpRedis.connect().then(() => tcpRedis);
  }

  return tcpRedisConnection;
}

export class RedisCacheClient {
  public static isConfigured(): boolean {
    return redis !== null || tcpRedis !== null;
  }

  /**
   * Guarda un valor con un tiempo de vida (TTL) en segundos.
   */
  public static async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (redis) {
      await redis.set(key, serializedValue, { ex: ttlSeconds });
      return;
    }

    const client = await getTcpRedisClient();
    if (!client) return;
    await client.set(key, serializedValue, { EX: ttlSeconds });
  }

  /**
   * Recupera un valor por su llave.
   */
  public static async get<T>(key: string): Promise<T | null> {
    if (redis) {
      const data = await redis.get(key);
      if (!data) return null;
      return (typeof data === 'string' ? JSON.parse(data) : data) as T;
    }

    const client = await getTcpRedisClient();
    if (!client) return null;
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  /**
   * Implementación de Idempotencia atómica.
   * Retorna true si la llave ya existía (duplicado).
   */
  public static async isDuplicate(key: string, ttlSeconds: number = 86400): Promise<boolean> {
    if (!redis && !tcpRedis) {
      logger.warn("Redis no configurado; idempotencia persistente desactivada.", {
        component: "RedisCacheClient",
        operation: "isDuplicate",
      });
      return false;
    }

    const idempotencyKey = `idempotency:${key}`;
    const exists = redis
      ? await redis.set(idempotencyKey, "1", { nx: true, ex: ttlSeconds })
      : await (await getTcpRedisClient())?.set(idempotencyKey, "1", {
        NX: true,
        EX: ttlSeconds,
      });

    return exists === null; // Si es null, es porque NO pudo setear (ya existía)
  }
}
