import { config } from "dotenv";

config({ path: [".env.production.local", ".env.local", ".env"], override: false, quiet: true });

const requiredVariables = [
  "DATABASE_URL",
  "DASHBOARD_TENANT_ID",
  "LLM_PROVIDER",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_BUSINESS_ACCOUNT_ID",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_INVITATION_TEMPLATE_NAME",
  "WHATSAPP_TEMPLATE_LANGUAGE",
  "ENFORCE_WHATSAPP_OPT_IN",
  "RETELL_API_KEY",
  "RETELL_AGENT_ID",
];

export function validateProductionEnv(env) {
  const errors = [];

  for (const name of requiredVariables) {
    if (!env[name]) {
      errors.push(`Missing ${name}`);
    }
  }

  if (env.UPSTASH_REDIS_REST_URL?.startsWith("redis://")) {
    errors.push("UPSTASH_REDIS_REST_URL must be an HTTPS REST URL, not a Redis TCP URL");
  } else if (
    env.UPSTASH_REDIS_REST_URL &&
    !env.UPSTASH_REDIS_REST_URL.startsWith("https://")
  ) {
    errors.push("UPSTASH_REDIS_REST_URL must start with https://");
  }

  if (!env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_REDIS_URL) {
    // Legacy Redis TCP URL from earlier configuration. Runtime supports it as fallback.
  }

  const hasUpstashRest = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
  const hasRedisTcp = Boolean(env.REDIS_URL || env.UPSTASH_REDIS_REST_REDIS_URL);
  if (!hasUpstashRest && !hasRedisTcp) {
    errors.push(
      "Missing Redis configuration: set UPSTASH_REDIS_REST_URL with UPSTASH_REDIS_REST_TOKEN, or REDIS_URL"
    );
  }

  if (!env.GROQ_API_KEY && !env.GOOGLE_AI_API_KEY) {
    errors.push("Missing at least one cloud LLM key: GROQ_API_KEY or GOOGLE_AI_API_KEY");
  }

  return { errors };
}

function runCli() {
  const result = validateProductionEnv(process.env);

  if (result.errors.length === 0) {
    console.log("Production environment check passed.");
    return;
  }

  console.error("Production environment check failed:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
