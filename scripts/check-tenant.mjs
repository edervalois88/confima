import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: [".env.production.local", ".env.local", ".env"], override: false, quiet: true });

export function validateTenantEnv(env) {
  const errors = [];

  if (!env.DATABASE_URL) errors.push("Missing DATABASE_URL");
  if (!env.DASHBOARD_TENANT_ID) errors.push("Missing DASHBOARD_TENANT_ID");

  return errors;
}

export async function verifyDashboardTenant(prisma, tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      whatsappBusinessAccountId: true,
      whatsappPhoneNumberId: true,
      subscription: {
        select: {
          canUploadExcel: true,
          hasWeatherConcierge: true,
          hasMapLogistics: true,
        },
      },
    },
  });

  if (!tenant) {
    return {
      ok: false,
      errors: [`Tenant ${tenantId} does not exist`],
    };
  }

  if (!tenant.subscription) {
    return {
      ok: false,
      errors: [`Tenant ${tenantId} is missing subscription`],
    };
  }

  return {
    ok: true,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      whatsappBusinessAccountId: tenant.whatsappBusinessAccountId ? "SET" : "MISSING",
      whatsappPhoneNumberId: tenant.whatsappPhoneNumberId ? "SET" : "MISSING",
      subscription: "SET",
    },
  };
}

async function runCli() {
  const errors = validateTenantEnv(process.env);

  if (errors.length > 0) {
    console.error("Tenant check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const result = await verifyDashboardTenant(prisma, process.env.DASHBOARD_TENANT_ID);

    if (!result.ok) {
      console.error("Tenant check failed:");
      for (const error of result.errors) console.error(`- ${error}`);
      process.exitCode = 1;
      return;
    }

    console.log("Tenant check passed.");
    console.log(JSON.stringify(result.tenant, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((error) => {
    console.error("Tenant check failed:");
    console.error(`- ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
