import test from "node:test";
import assert from "node:assert/strict";
import { validateProductionEnv } from "./check-production-env.mjs";

const completeEnv = {
  DATABASE_URL: "postgresql://user:pass@example.com:5432/confima?sslmode=require",
  DASHBOARD_TENANT_ID: "tenant-id",
  LLM_PROVIDER: "auto",
  GROQ_API_KEY: "groq-key",
  GOOGLE_AI_API_KEY: "google-key",
  WHATSAPP_PHONE_NUMBER_ID: "phone-number-id",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "waba-id",
  WHATSAPP_ACCESS_TOKEN: "access-token",
  WHATSAPP_VERIFY_TOKEN: "verify-token",
  WHATSAPP_APP_SECRET: "app-secret",
  WHATSAPP_INVITATION_TEMPLATE_NAME: "confirma_wedding_invitation_v1",
  WHATSAPP_TEMPLATE_LANGUAGE: "es_MX",
  ENFORCE_WHATSAPP_OPT_IN: "true",
  UPSTASH_REDIS_REST_URL: "https://usable-upstash-url",
  UPSTASH_REDIS_REST_TOKEN: "upstash-token",
  RETELL_API_KEY: "retell-key",
  RETELL_AGENT_ID: "retell-agent",
};

test("accepts a complete production environment", () => {
  const result = validateProductionEnv(completeEnv);

  assert.deepEqual(result.errors, []);
});

test("requires tenant, WhatsApp business account, and one Redis configuration", () => {
  const result = validateProductionEnv({
    ...completeEnv,
    DASHBOARD_TENANT_ID: "",
    WHATSAPP_BUSINESS_ACCOUNT_ID: "",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
  });

  assert.deepEqual(result.errors, [
    "Missing DASHBOARD_TENANT_ID",
    "Missing WHATSAPP_BUSINESS_ACCOUNT_ID",
    "Missing Redis configuration: set UPSTASH_REDIS_REST_URL with UPSTASH_REDIS_REST_TOKEN, or REDIS_URL",
  ]);
});

test("rejects Redis TCP URLs for the Upstash REST client", () => {
  const result = validateProductionEnv({
    ...completeEnv,
    UPSTASH_REDIS_REST_URL: "redis://default:password@example.com:6379",
  });

  assert.deepEqual(result.errors, [
    "UPSTASH_REDIS_REST_URL must be an HTTPS REST URL, not a Redis TCP URL",
  ]);
});

test("accepts the legacy Redis TCP variable", () => {
  const envWithoutRedisUrl = { ...completeEnv };
  delete envWithoutRedisUrl.UPSTASH_REDIS_REST_URL;
  const result = validateProductionEnv({
    ...envWithoutRedisUrl,
    UPSTASH_REDIS_REST_REDIS_URL: "redis://default:password@example.com:6379",
  });

  assert.deepEqual(result.errors, []);
});

test("accepts Redis TCP configuration without Upstash REST credentials", () => {
  const envWithTcpRedis = { ...completeEnv };
  delete envWithTcpRedis.UPSTASH_REDIS_REST_URL;
  delete envWithTcpRedis.UPSTASH_REDIS_REST_TOKEN;

  const result = validateProductionEnv({
    ...envWithTcpRedis,
    REDIS_URL: "redis://default:password@example.com:6379",
  });

  assert.deepEqual(result.errors, []);
});
