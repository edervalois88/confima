import test from "node:test";
import assert from "node:assert/strict";
import { validateRedisEnv, verifyRedisIdempotency } from "./check-redis.mjs";

test("requires one Redis configuration", () => {
  assert.deepEqual(validateRedisEnv({}), [
    "Missing Redis configuration: set UPSTASH_REDIS_REST_URL with UPSTASH_REDIS_REST_TOKEN, or REDIS_URL",
  ]);
});

test("rejects Redis TCP URLs in the Upstash REST variable", () => {
  assert.deepEqual(
    validateRedisEnv({
      UPSTASH_REDIS_REST_URL: "redis://default:secret@example.com:6379",
      UPSTASH_REDIS_REST_TOKEN: "token",
    }),
    ["UPSTASH_REDIS_REST_URL must be an HTTPS REST URL, not a Redis TCP URL"]
  );
});

test("accepts Redis TCP URL configuration", () => {
  assert.deepEqual(
    validateRedisEnv({
      REDIS_URL: "redis://default:secret@example.com:6379",
    }),
    []
  );
});

test("accepts the legacy Redis TCP URL variable", () => {
  assert.deepEqual(
    validateRedisEnv({
      UPSTASH_REDIS_REST_REDIS_URL: "redis://default:secret@example.com:6379",
    }),
    []
  );
});

test("verifies Redis atomic idempotency with set nx", async () => {
  const storedKeys = new Set();
  const fakeRedis = {
    async set(key, value, options) {
      assert.equal(value, "1");
      assert.deepEqual(options, { nx: true, ex: 60 });
      if (storedKeys.has(key)) return null;
      storedKeys.add(key);
      return "OK";
    },
    async del(key) {
      storedKeys.delete(key);
      return 1;
    },
  };

  const result = await verifyRedisIdempotency(fakeRedis, "check-id");

  assert.deepEqual(result, {
    ok: true,
    key: "health:redis:idempotency:check-id",
  });
});
