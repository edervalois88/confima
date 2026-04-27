# Registro Meta-Cognitivo Local (MCP & Clean Architecture)

Este documento instaura las leyes irreductibles, directivas estructurales y pautas de Inteligencia Artificial locales que gobiernan el repositorio `reservAItion`. 
Cualquier Agente LLM o sistema subyacente interactuando con este código debe someterse incondicionalmente a estos estatutos para conservar la arquitectura de 4 anillos puristas.

## 1. Topología Concéntrica Obligatoria (Clean Architecture)
El monorepositorio rechaza estructuras genéricas y obliga la subdivisión topológica:
- **Anillo 1: Domain (`/domain`)**: Las reglas del negocio en tiempo de ejecución puro. Ignora toda base de datos o framework externo.
- **Anillo 2: Application (`/application`)**: Orquesta casos de uso. Implementa puertos (Interfaces) para inyectar recursos. La dependencia va *hacia* el Domain.
- **Anillo 3: Presentation (`/presentation`)**: Todo lo relacionado con React Server Components, Server Actions y la visualización front-end de LangGraph o hooks de hidración.
- **Anillo 4: Infrastructure (`/infrastructure`)**: La frontera que agrupa el mundo exterior (Prisma ORM, Vercel AI SDK, Supabase Realtime, OpenTable APIs). Sólo pueden interactuar con los Anillos internos cumpliendo Interfaces del Anillo 2.

## 2. Tipado Determinista Estricto (Prohibición Absoluta de `any`)
Todo flujo de memoria interna, agente o componente web debe evitar usar tipos `any` u objetos implícitos. Toda variable sujeta a validación externa o persistencia asíncrona exige esquemas **Zod** nativos para garantizar inferencia probabilística. 

## 3. Telemetría de Latencia (Voz a Texto a Voz - VAD)
- Las operaciones hacia y desde el LLM Supervisor (LangGraph) están limitadas temporalmente. 
- Los módulos infraestructurales que procesen Audio en stream hacia *Deepgram Nova-3* y salidad *Cartesia* se consideran procesos del **Anillo 4** y deben enviar un buffer puro hacia entidades transitorias en el **Anillo 2**, previniendo acoplar la UI de React al protocolo UDP o WebSockets de Voz.

## 4. Estrategias Operacionales a Prueba de Fallos
No existen las rupturas silenciosas:
1. Toda excepción se ramifica semánticamente heredando de `DomainError` o `InfrastructureCommunicationError`.
2. Las transacciones con API en peligro (REST corporativos bloqueados) desencadenan la **"Degradación Elegante"**. El usuario en la terminal telefónica o Web App recibe retroalimentación inmediata, y de existir error sincrónico, se delega al SMS / Correo como proceso en segundo plano para no interrumpir la "llamada/sesión" activa.

*Alerta de Auditoría Algorítmica: Implementado bajo directiva prioritaria de Staff Engineer.*
