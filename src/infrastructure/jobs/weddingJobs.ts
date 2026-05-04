import { inngest } from "../../infrastructure/jobs/InngestClient";
import { OpenWeatherProvider } from "../../infrastructure/weather/OpenWeatherProvider";

/**
 * @fileoverview Definición de Funciones de Inngest (Background Jobs).
 * Anillo 4: Orchestration.
 */

export const proactiveConciergeFunc = inngest.createFunction(
  { id: "proactive-wedding-concierge", retries: 5, triggers: [{ event: "wedding/proactive-check" }] },
  async ({ event, step }) => {
    const { tenantId, guestId, phone, weddingDate } = event.data;

    // 1. Espera diferida (72 horas antes de la boda)
    // Calculamos la fecha exacta: T-72h
    const triggerDate = new Date(new Date(weddingDate).getTime() - (72 * 60 * 60 * 1000)).toISOString();
    await step.sleepUntil("wait-for-72h-before", triggerDate);

    // 2. Obtención de datos meteorológicos y logísticos (Provider inyectado)
    const logistics = await step.run("fetch-logistics", async () => {
      const provider = new OpenWeatherProvider();
      const weather = await provider.getForecast(20.6736, -103.344, weddingDate);
      return {
        temp: weather.tempCelsius,
        condition: weather.condition,
        location: "Hacienda del Carmen, GDL"
      };
    });

    // 3. Envío Outbound vía WhatsApp Template (Meta Compliance)
    // Se utiliza una plantilla con botones para abrir la ventana de 24h
    await step.run("send-whatsapp-template", async () => {
      console.log(`[WHATSAPP_PROACTIVE] Tenant ${tenantId}: enviando plantilla 'wedding_proactive_invite' a ${phone}`);
      console.log(`[TEMPLATE_PARAMS] Clima: ${logistics.temp}°C, Ubicacion: ${logistics.location}`);
      
      // En producción: messagingProvider.sendTemplateMessage(phone, {
      //   name: "wedding_proactive_invite",
      //   components: [
      //     { type: "body", parameters: [{ type: "text", text: logistics.location }, { type: "text", text: `${logistics.temp}°C` }] },
      //     { type: "button", sub_type: "quick_reply", index: 0, parameters: [{ type: "payload", payload: "WEATHER_QUERY" }] }
      //   ]
      // });
    });

    return { status: "PROACTIVE_SENT", tenantId, guestId };
  }
);


/**
 * Función de monitoreo 'Day-of': Se ejecuta cada 30 minutos el día del evento.
 * Anillo 4: Infraestructura / Automatización.
 */
export const dayOfMonitoringFunc = inngest.createFunction(
  { id: "day-of-monitoring", retries: 3, triggers: [{ cron: "*/30 * * * *" }] },
  async ({ step }) => {
    // 1. Obtener bodas activas para la fecha actual (Simulación)
    const activeWeddings = await step.run("fetch-active-weddings", async () => {
      // Nota: Aquí se inyectaría un Repositorio de Prisma para filtrar por fecha
      return [{ id: "w1", tenantId: "t1", lat: 20.6736, lon: -103.344 }];
    });

    for (const wedding of activeWeddings) {
      // 2. Sensorización de Clima Crítico (Anillo 4)
      const weather = await step.run(`check-weather-${wedding.id}`, async () => {
        const provider = new OpenWeatherProvider();
        return await provider.getForecast(wedding.lat, wedding.lon, new Date().toISOString());
      });

      // 3. Disparador de Contingencia si el clima es severo o lluvioso
      if (weather.tempCelsius < 15 || weather.tempCelsius > 35 || weather.condition === "Rain") {
        await step.sendEvent("event-contingency-detected", {
          name: "wedding/contingency-detected",
          data: {
            tenantId: wedding.tenantId,
            contingencyType: "WEATHER",
            severity: "HIGH",
            description: `Alerta Meteorologica: ${weather.tempCelsius}°C - ${weather.condition}`
          }
        });
      }
    }
  }
);

/**
 * Función Post-Evento: Se dispara 24h después de la boda para recolectar feedback.
 * Anillo 4: Infraestructura / CRM Proactivo.
 */
export const postEventFeedbackFunc = inngest.createFunction(
  { id: "post-event-feedback", retries: 5, triggers: [{ event: "wedding/event-finished" }] },
  async ({ event, step }) => {
    const { tenantId, weddingDate } = event.data;

    // 1. Espera estratégica de 24 horas (Post-resaca del evento)
    const feedbackDate = new Date(new Date(weddingDate).getTime() + 24 * 60 * 60 * 1000).toISOString();
    await step.sleepUntil("wait-for-feedback-window", feedbackDate);

    // 2. Obtener lista de asistentes (Simulación)
    const attendees = await step.run("fetch-attendees", async () => {
      return [{ id: "g1", phone: "521234567890", name: "Invitado Demo" }];
    });

    for (const guest of attendees) {
      await step.run(`send-whatsapp-feedback-${guest.id}`, async () => {
        console.log(`[POST_EVENT] Tenant ${tenantId}: solicitando feedback a ${guest.name} via WhatsApp.`);
        // Aquí se usaría el IMessagingProvider para enviar la plantilla 'event_feedback'
      });
    }

    return { status: "FEEDBACK_REQUESTS_ENQUEUED", tenantId, total: attendees.length };
  }
);

