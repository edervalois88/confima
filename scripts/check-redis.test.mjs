import test from "node:test";
import assert from "node:assert/strict";
import { validateRedisEnv, verifyRedisIdempotency } from "./check-redis.mjs";

test("requires Upstash REST URL and token", () => {
  assert.deepEqual(validateRedisEnv({}), [
    "Missing UPSTASH_REDIS_REST_URL",
    "Missing UPSTASH_REDIS_REST_TOKEN",
  ]);
});

test("rejects Redis TCP URLs", () => {
  assert.deepEqual(
    validateRedisEnv({
      UPSTASH_REDIS_REST_URL: "redis://default:secret@example.com:6379",
      UPSTASH_REDIS_REST_TOKEN: "token",
    }),
    ["UPSTASH_REDIS_REST_URL must be an HTTPS REST URL, not a Redis TCP URL"]
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
