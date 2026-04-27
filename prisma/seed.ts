import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedEventInput {
  name: string;
  hosts: string;
  eventDate: Date;
  venueName: string;
  venueAddress: string;
  guestCount: number;
  phonePrefix: string;
}

const firstNames = [
  'Ana', 'Bruno', 'Camila', 'Diego', 'Elena', 'Fernando', 'Gabriela', 'Hector',
  'Isabel', 'Javier', 'Karla', 'Luis', 'Mariana', 'Nicolas', 'Olivia', 'Pablo',
  'Renata', 'Santiago', 'Teresa', 'Uriel', 'Valeria', 'Ximena', 'Yahir', 'Zoé',
  'Andres', 'Claudia', 'Daniel', 'Emilia', 'Francisco', 'Gloria', 'Iván', 'Julia',
  'Leonardo', 'Montserrat', 'Patricio', 'Regina', 'Sofia', 'Tomás', 'Victoria', 'Mateo',
];

const lastNames = [
  'Valois', 'Hernandez', 'Gomez', 'Ramirez', 'Lopez', 'Martinez', 'Torres', 'Castillo',
  'Sanchez', 'Morales', 'Rivera', 'Vargas', 'Cruz', 'Flores', 'Navarro', 'Reyes',
];

const rsvpStatuses = [
  'PENDING_SEND', 'PENDING_SEND', 'DELIVERED', 'DELIVERED', 'READ',
  'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'DECLINED',
];

const specialNeeds = [
  null,
  null,
  null,
  'Vegetariano',
  'Sin gluten',
  'Alergia a nueces',
  'Acceso para silla de ruedas',
  'Menu infantil autorizado por anfitriones',
];

async function main() {
  console.log('--- INICIANDO SEED DE CON FIRMA ---');

  await prisma.messageLog.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.reservationLog.deleteMany();
  await prisma.telemetryNode.deleteMany();
  await prisma.eventFAQ.deleteMany();
  await prisma.eventFact.deleteMany();
  await prisma.guestProfile.deleteMany();
  await prisma.event.deleteMany();
  await prisma.tenantSubscription.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: {
      name: 'con Firma Demo',
      subscription: {
        create: {
          canUploadExcel: true,
          hasWeatherConcierge: true,
          hasMapLogistics: true,
        },
      },
    },
  });

  const events: SeedEventInput[] = [
    {
      name: 'Boda Mariana & Roberto',
      hosts: 'Mariana & Roberto',
      eventDate: new Date('2026-10-17T18:00:00-06:00'),
      venueName: 'Hacienda San Gabriel',
      venueAddress: 'Camino Real 245, Zapopan, Jalisco',
      guestCount: 36,
      phonePrefix: '521555100',
    },
    {
      name: 'Boda Sofia & Daniel',
      hosts: 'Sofia & Daniel',
      eventDate: new Date('2026-11-21T17:30:00-06:00'),
      venueName: 'Jardin Los Encinos',
      venueAddress: 'Av. de las Flores 88, Valle de Bravo, Estado de Mexico',
      guestCount: 34,
      phonePrefix: '521555200',
    },
  ];

  for (const eventInput of events) {
    const event = await prisma.event.create({
      data: {
        tenantId: tenant.id,
        name: eventInput.name,
        hosts: eventInput.hosts,
        eventDate: eventInput.eventDate,
        venueName: eventInput.venueName,
        venueAddress: eventInput.venueAddress,
      },
    });

    await seedFacts(event.id, eventInput);
    await seedFaqs(event.id, eventInput);
    await seedGuests(tenant.id, event.id, eventInput);

    console.log(`Evento sembrado: ${event.name} (${eventInput.guestCount} invitados)`);
  }

  console.log('--- SEED COMPLETADO ---');
}

async function seedFacts(eventId: string, event: SeedEventInput) {
  const facts = [
    ['horario', 'ceremonia_hora', 'La ceremonia inicia a las 18:00. Recomendamos llegar 30 minutos antes.'],
    ['horario', 'recepcion_hora', 'La recepcion inicia al terminar la ceremonia, aproximadamente a las 19:00.'],
    ['ubicacion', 'venue_nombre', event.venueName],
    ['ubicacion', 'venue_direccion', event.venueAddress],
    ['vestimenta', 'dress_code', 'Codigo de vestimenta: formal elegante. Evitar blanco, marfil y tonos muy claros.'],
    ['regalos', 'mesa_regalos', 'La mesa de regalos se compartira por este canal cuando los anfitriones la confirmen.'],
    ['ninos', 'ninos_permitidos', 'Evento principalmente para adultos. Excepciones solo para familiares directos confirmados.'],
    ['transporte', 'estacionamiento', 'Habra valet parking en la entrada principal del recinto.'],
    ['menu', 'necesidades_especiales', 'Las restricciones alimentarias pueden registrarse por WhatsApp antes de la fecha limite.'],
  ];

  await prisma.eventFact.createMany({
    data: facts.map(([category, key, value]) => ({
      eventId,
      category,
      key,
      value,
      visibility: 'GUEST',
    })),
  });
}

async function seedFaqs(eventId: string, event: SeedEventInput) {
  const faqs = [
    ['ubicacion', '¿Dónde es la boda?', `La boda sera en ${event.venueName}, ubicado en ${event.venueAddress}.`],
    ['horario', '¿A qué hora debo llegar?', 'Recomendamos llegar 30 minutos antes de la ceremonia.'],
    ['vestimenta', '¿Cuál es el código de vestimenta?', 'El codigo de vestimenta es formal elegante. Evitar blanco, marfil y tonos muy claros.'],
    ['ninos', '¿Puedo llevar niños?', 'El evento es principalmente para adultos. Las excepciones deben estar confirmadas por los anfitriones.'],
    ['menu', '¿Puedo pedir menú especial?', 'Si. Responde por WhatsApp indicando tu restriccion alimentaria o necesidad especial.'],
    ['transporte', '¿Hay estacionamiento?', 'Si. Habra valet parking en la entrada principal del recinto.'],
  ];

  await prisma.eventFAQ.createMany({
    data: faqs.map(([category, question, answer]) => ({
      eventId,
      category,
      question,
      answer,
      active: true,
    })),
  });
}

async function seedGuests(tenantId: string, eventId: string, event: SeedEventInput) {
  for (let index = 0; index < event.guestCount; index += 1) {
    const name = `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
    const phone = `${event.phonePrefix}${String(index + 1).padStart(4, '0')}`;
    const rsvpStatus = rsvpStatuses[index % rsvpStatuses.length];
    const need = specialNeeds[index % specialNeeds.length];
    const partySize = (index % 4) + 1;

    const guest = await prisma.guestProfile.create({
      data: {
        tenantId,
        eventId,
        name,
        phoneFingerprint: phone,
        contactSource: index % 3 === 0 ? 'WHATSAPP' : 'EXCEL',
        rsvpStatus,
        partySize,
        specialNeeds: need,
        whatsappOptInStatus: 'OBTAINED',
        whatsappOptInSource: index % 3 === 0 ? 'WHATSAPP_KEYWORD' : 'HOST_IMPORT_ATTESTATION',
        whatsappOptInAt: new Date('2026-04-20T12:00:00-06:00'),
        whatsappOptInText: 'Acepto recibir por WhatsApp informacion relacionada con esta invitacion de boda, incluyendo confirmacion, ubicacion y recordatorios del evento.',
        dietaryRestrictions: need && need.includes('Vegetariano') ? need : null,
        vipReliabilityScore: index % 10,
        lastInboundAt: rsvpStatus === 'CONFIRMED' ? new Date() : null,
      },
    });

    await prisma.invitation.create({
      data: {
        eventId,
        guestId: guest.id,
        templateName: 'wedding_invitation_v1',
        status: rsvpStatus === 'PENDING_SEND' ? 'QUEUED' : 'SENT',
        sentAt: rsvpStatus === 'PENDING_SEND' ? null : new Date(),
      },
    });

    await prisma.reservationLog.create({
      data: {
        guestId: guest.id,
        temporalStartISO: event.eventDate,
        partySizeCapacity: partySize,
        statusState: rsvpStatus,
      },
    });

    if (rsvpStatus === 'CONFIRMED' || rsvpStatus === 'DECLINED') {
      await prisma.messageLog.createMany({
        data: [
          {
            tenantId,
            eventId,
            guestId: guest.id,
            direction: 'INBOUND',
            body: rsvpStatus === 'CONFIRMED' ? 'Confirmo mi asistencia' : 'No podre asistir',
            intent: rsvpStatus === 'CONFIRMED' ? 'CONFIRM' : 'DECLINE',
          },
          {
            tenantId,
            eventId,
            guestId: guest.id,
            direction: 'OUTBOUND',
            body: rsvpStatus === 'CONFIRMED'
              ? 'Gracias, tu asistencia queda confirmada.'
              : 'Gracias por avisarnos. Registramos que no podras asistir.',
            intent: rsvpStatus === 'CONFIRMED' ? 'CONFIRM' : 'DECLINE',
          },
        ],
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
