import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @fileoverview Script de siembra (Seed) para entorno local.
 * Genera un Tenant Premium y 3 invitados con diferentes perfiles.
 */

async function main() {
  console.log('--- INICIANDO SIEMBRA DE DATOS (SEED) ---');

  // 1. Crear un Tenant (Inquilino) de prueba
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Boda Premium Eder & Sophie',
      subscription: {
        create: {
          canUploadExcel: true,
          hasWeatherConcierge: true,
          hasMapLogistics: true,
        },
      },
    },
  });

  console.log(`✅ Tenant creado: \${tenant.name} (ID: \${tenant.id})`);

  // 2. Crear Invitados de prueba
  const guests = [
    {
      tenantId: tenant.id,
      phoneFingerprint: '525511223344',
      contactSource: 'WHATSAPP',
      rsvpStatus: 'PENDING_SEND',
      dietaryRestrictions: 'Celíaco',
    },
    {
      tenantId: tenant.id,
      phoneFingerprint: '525599887766',
      contactSource: 'EXCEL',
      rsvpStatus: 'CONFIRMED',
      dietaryRestrictions: 'Vegetariano',
    },
    {
      tenantId: tenant.id,
      phoneFingerprint: '525544556677',
      contactSource: 'MANUAL',
      rsvpStatus: 'PENDING_SEND',
      dietaryRestrictions: 'Ninguna',
    },
  ];

  for (const guest of guests) {
    const createdGuest = await prisma.guestProfile.create({
      data: guest,
    });
    console.log(`👤 Invitado creado: \${createdGuest.phoneFingerprint}`);

    // Crear un log de reservación inicial
    await prisma.reservationLog.create({
      data: {
        guestId: createdGuest.id,
        temporalStartISO: new Date(2026, 5, 20, 18, 0), // 20 de Junio 2026
        partySizeCapacity: 2,
        statusState: 'INITIAL_CONTACT',
      },
    });
  }

  console.log('--- SIEMBRA COMPLETADA CON ÉXITO ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
