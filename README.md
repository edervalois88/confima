# con Firma

Sistema de gestion de invitaciones para bodas. El flujo principal es cargar invitados, enviar invitaciones por WhatsApp, responder dudas basicas del evento con IA y mantener el backoffice actualizado con confirmaciones y necesidades especiales.

## Stack

- Next.js App Router
- Prisma + PostgreSQL
- WhatsApp Cloud API
- LLM providers: Groq, Google Gemini y Ollama local
- Inngest para trabajos en segundo plano

## Desarrollo local

```bash
npm install
npm run prisma:generate
npm run dev
```

## Variables de entorno

Usa `.env.example` como base. No subas `.env` ni `.env.local`.

Variables minimas para Vercel:

```env
DATABASE_URL=
LLM_PROVIDER=auto
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GOOGLE_AI_API_KEY=
GOOGLE_AI_MODEL=gemini-flash-latest
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_INVITATION_TEMPLATE_NAME=confirma_wedding_invitation_v1
WHATSAPP_TEMPLATE_LANGUAGE=es_MX
ENFORCE_WHATSAPP_OPT_IN=true
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Base de datos

Vercel ejecuta la app y las rutas API como funciones serverless. La base de datos debe vivir en un servicio PostgreSQL externo o integrado, por ejemplo Vercel Postgres, Neon, Supabase o Railway.

Despues de configurar `DATABASE_URL`:

```bash
npm run prisma:push
```

## Deploy en Vercel

1. Importa el repo desde GitHub.
2. Framework: Next.js.
3. Build command: `npm run build`.
4. Agrega las variables de entorno del proyecto.
5. Ejecuta `npm run prisma:push` contra la base de datos de produccion desde un entorno seguro o desde una tarea controlada.

## Webhooks

Para WhatsApp Cloud API, configura en Meta el webhook publico de Vercel:

```text
https://TU-DOMINIO.vercel.app/api/webhooks/whatsapp
```

Usa el mismo `WHATSAPP_VERIFY_TOKEN` en Meta y en Vercel.

## Checklist de salida a produccion

1. Configura `DATABASE_URL` con PostgreSQL externo y ejecuta `npm run prisma:push`.
2. Ejecuta `npm run prisma:seed` solo si necesitas datos demo.
3. Crea o valida en Meta la plantilla `WHATSAPP_INVITATION_TEMPLATE_NAME` con idioma `WHATSAPP_TEMPLATE_LANGUAGE`.
4. Configura el webhook publico `https://TU-DOMINIO.vercel.app/api/webhooks/whatsapp`.
5. Publica la ruta `/api/inngest` en Inngest y confirma que el evento `whatsapp/message.received` llega al job.
6. Configura Redis Upstash para idempotencia compartida entre funciones serverless.
7. Ejecuta `npm run verify` con las variables reales antes de desplegar.

## Limitaciones actuales

- El planner de IA del dashboard usa servicios mock para presupuesto/proveedores.
- El widget de voz crea sesion en Retell, pero la conexion WebRTC del SDK aun esta simulada en la UI.
- Las invitaciones proactivas y jobs day-of usan datos simulados; requieren repositorios Prisma reales antes de activarse.
