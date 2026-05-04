# Go-live checklist

## 1. Base de datos

Configura PostgreSQL externo y usa la misma URL en local, Vercel e Inngest.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
npm run prisma:push
```

Usa datos demo solo si el entorno no es productivo:

```bash
npm run prisma:seed
```

## 2. WhatsApp Cloud API

En Meta Developer:

1. Configura el webhook: `https://TU-DOMINIO.vercel.app/api/webhooks/whatsapp`.
2. Usa el mismo `WHATSAPP_VERIFY_TOKEN` configurado en Vercel.
3. Copia `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` y `WHATSAPP_ACCESS_TOKEN` a variables de entorno.
4. Crea y aprueba la plantilla `WHATSAPP_INVITATION_TEMPLATE_NAME` con idioma `WHATSAPP_TEMPLATE_LANGUAGE`.

Variables obligatorias:

```env
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_INVITATION_TEMPLATE_NAME=confirma_wedding_invitation_v1
WHATSAPP_TEMPLATE_LANGUAGE=es_MX
ENFORCE_WHATSAPP_OPT_IN=true
SEED_WHATSAPP_WABA_ID=
SEED_WHATSAPP_PHONE_NUMBER_ID=
```

## 3. Inngest

Publica la ruta:

```text
https://TU-DOMINIO.vercel.app/api/inngest
```

Luego valida que el evento `whatsapp/message.received` ejecute el job `whatsapp-receiver`.

## 4. Redis

Configura Upstash para que la idempotencia funcione entre funciones serverless:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Sin Redis, la deduplicacion queda limitada a memoria de una instancia y no es suficiente para produccion serverless.

## 5. IA

Configura al menos un proveedor cloud:

```env
LLM_PROVIDER=auto
GROQ_API_KEY=
GOOGLE_AI_API_KEY=
```

Para local:

```env
USE_LOCAL_AI=true
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.1
```

## 6. Voz

Retell crea la sesion server-side, pero la UI aun no inicializa el SDK WebRTC real.

```env
RETELL_API_KEY=
RETELL_AGENT_ID=
```

Pendiente de implementacion: integrar el SDK cliente de Retell en `VoiceCallWidget`.

## 7. Verificacion

Antes de desplegar:

```bash
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
```

`npm audit --audit-level=moderate` aun reporta issues que requieren migraciones breaking: `ai` v6, LangChain/LangGraph y Next/PostCSS.
