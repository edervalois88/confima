# WhatsApp Compliance para con Firma

## Decision operativa

Para iniciar una conversacion con un invitado, con Firma debe usar una plantilla aprobada en Meta WhatsApp Manager. No se debe iniciar con texto libre desde el backend.

Una vez que el invitado responde, el sistema abre una ventana de atencion de 24 horas y puede responder con texto libre dentro de esa ventana. Si la ventana vence, el siguiente contacto proactivo debe volver a ser una plantilla aprobada.

## Plantilla inicial sugerida

Nombre:

```text
confirma_wedding_invitation_v1
```

Categoria:

```text
UTILITY
```

Idioma:

```text
es_MX
```

Cuerpo:

```text
Hola {{1}}, es un gusto informarte que has recibido una invitacion para {{2}} de {{3}}. El evento sera el {{4}} en {{5}}. Responde CONFIRMAR para confirmar asistencia, NO ASISTO si no podras asistir, o escribe tu pregunta. Si no deseas recibir mensajes de esta invitacion, responde STOP.
```

Variables:

```text
{{1}} guest_name
{{2}} event_name
{{3}} hosts
{{4}} event_date
{{5}} venue_name
```

## Reglas implementadas

- `GuestProfile.whatsappOptInStatus` guarda si el invitado tiene consentimiento.
- `GuestProfile.whatsappOptInSource`, `whatsappOptInAt` y `whatsappOptInText` guardan evidencia de consentimiento.
- `GuestProfile.messagingPaused` y `whatsappOptOutAt` bloquean nuevos envios si el invitado pide baja.
- `GuestProfile.serviceWindowExpiresAt` controla si se permite respuesta libre.
- `MessageLog.messageType`, `templateName`, `complianceStatus` y `complianceReason` auditan cada decision.
- `Invitation.complianceStatus` y `complianceReason` registran por que una invitacion fue enviada o bloqueada.

## Importacion de invitados

Al cargar Excel/CSV, el sistema debe pedir una columna o confirmacion de opt-in. El texto minimo recomendado es:

```text
Acepto recibir por WhatsApp informacion relacionada con esta invitacion de boda, incluyendo confirmacion, ubicacion y recordatorios del evento.
```

Si no existe consentimiento, el invitado debe quedar en `UNKNOWN` y no se le debe iniciar conversacion por WhatsApp cuando `ENFORCE_WHATSAPP_OPT_IN` este activo.

## Manejo de bajas

Si el invitado responde `STOP`, `baja`, `cancelar`, `salir` o una frase equivalente, el sistema:

1. Marca `whatsappOptInStatus = OPTED_OUT`.
2. Marca `messagingPaused = true`.
3. Guarda `whatsappOptOutAt`.
4. Responde una confirmacion breve de baja.

## Buenas practicas de envio

- Enviar por lotes pequenos y escalonados, no toda la lista en un solo golpe.
- Evitar reenviar a invitados que no responden.
- No mezclar mensajes promocionales con plantillas de utilidad.
- No usar IA para inventar datos no cargados en facts o FAQs del evento.
- Medir bloqueos, opt-outs, fallos de entrega y tasa de respuesta antes de subir volumen.

