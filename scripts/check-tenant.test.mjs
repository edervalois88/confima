import test from "node:test";
import assert from "node:assert/strict";
import { validateTenantEnv, verifyDashboardTenant } from "./check-tenant.mjs";

test("requires database URL and dashboard tenant id", () => {
  assert.deepEqual(validateTenantEnv({}), [
    "Missing DATABASE_URL",
    "Missing DASHBOARD_TENANT_ID",
  ]);
});

test("verifies dashboard tenant context", async () => {
  const prisma = {
    tenant: {
      async findUnique(input) {
        assert.deepEqual(input, {
          where: { id: "tenant-1" },
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

        return {
          id: "tenant-1",
          name: "con Firma Production",
          whatsappBusinessAccountId: null,
          whatsappPhoneNumberId: "phone-1",
          subscription: {
            canUploadExcel: true,
            hasWeatherConcierge: true,
            hasMapLogistics: true,
          },
        };
      },
    },
  };

  const result = await verifyDashboardTenant(prisma, "tenant-1");

  assert.deepEqual(result, {
    ok: true,
    tenant: {
      id: "tenant-1",
      name: "con Firma Production",
      whatsappBusinessAccountId: "MISSING",
      whatsappPhoneNumberId: "SET",
      subscription: "SET",
    },
  });
});

test("rejects tenant without subscription", async () => {
  const prisma = {
    tenant: {
      async findUnique() {
        return {
          id: "tenant-1",
          name: "con Firma Production",
          whatsappBusinessAccountId: null,
          whatsappPhoneNumberId: null,
          subscription: null,
        };
      },
    },
  };

  const result = await verifyDashboardTenant(prisma, "tenant-1");

  assert.deepEqual(result, {
    ok: false,
    errors: ["Tenant tenant-1 is missing subscription"],
  });
});
