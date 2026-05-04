import { Redis } from "@upstash/redis";
import { config } from "dotenv";
import crypto from "node:crypto";

config({ path: [".env.production.local", ".env.local", ".env"], override: false, quiet: true });

export function validateRedisEnv(env) {
  const errors = [];

  if (!env.UPSTASH_REDIS_REST_URL) {
    errors.push("Missing UPSTASH_REDIS_REST_URL");
  }

  if (!env.UPSTASH_REDIS_REST_TOKEN) {
    errors.push("Missing UPSTASH_REDIS_REST_TOKEN");
  }

  if (env.UPSTASH_REDIS_REST_URL?.startsWith("redis://")) {
    errors.push("UPSTASH_REDIS_REST_URL must be an HTTPS REST URL, not a Redis TCP URL");
  } else if (
    env.UPSTASH_REDIS_REST_URL &&
    !env.UPSTASH_REDIS_REST_URL.startsWith("https://")
  ) {
    errors.push("UPSTASH_REDIS_REST_URL must start with https://");
  }

  return errors;
}

export async function verifyRedisIdempotency(redis, id) {
  const key = `health:redis:idempotency:${id}`;
  await redis.del(key);

  const firstWrite = await redis.set(key, "1", { nx: true, ex: 60 });
  const secondWrite = await redis.set(key, "1", { nx: true, ex: 60 });
  await redis.del(key);

  return {
    ok: firstWrite !== null && secondWrite === null,
    key,
  };
}

async function runCli() {
  const errors = validateRedisEnv(process.env);

  if (errors.length > 0) {
    console.error("Redis check failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  const result = await verifyRedisIdempotency(redis, crypto.randomUUID());

  if (!result.ok) {
    console.error("Redis check failed:");
    console.error("- SET NX did not reject the duplicate idempotency key");
    process.exitCode = 1;
    return;
  }

  console.log("Redis check passed.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((error) => {
    console.error("Redis check failed:");
    console.error(`- ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
