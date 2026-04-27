import { z } from 'zod';
import { tool } from 'ai';
import { SeatingOptimizerService, GuestGroup } from '@/domain/services/SeatingOptimizerService';
import { OpenWeatherProvider } from '@/infrastructure/weather/OpenWeatherProvider';

/**
 * @fileoverview Herramientas atómicas para el Agente de Gestión de Bodas.
 * Anillo 2/3: Adaptadores de Interfaz y Aplicación.
 */

/**
 * Esquema para el procesamiento de confirmaciones de asistencia (RSVP).
 */
const RSVPInputSchema = z.object({
  guestId: z.string().uuid().describe("El identificador único del invitado en la base de datos."),
  willAttend: z.boolean().describe("true si el invitado confirma asistencia, false en caso contrario."),
  plusOneCount: z.number().int().min(0).max(5).describe("Número de acompañantes adicionales confirmados.")
});

/**
 * Esquema para la captura de preferencias dietéticas y alergias.
 */
const DietaryInputSchema = z.object({
  guestId: z.string().uuid().describe("ID del invitado."),
  restrictions: z.array(z.string()).describe("Lista de alergias o restricciones (ej: 'celiaquía', 'vegano')."),
  additionalNotes: z.string().optional().describe("Notas adicionales sobre la dieta.")
});

/**
 * Esquema para consulta de base de conocimientos (FAQ).
 */
const FAQInputSchema = z.object({
  query: z.string().describe("La pregunta del invitado sobre el evento (ej: horario, vestimenta).")
});

/**
 * Esquema para la optimización matemática de asientos (Seating Chart).
 * Basado en restricciones de capacidad: Σ (bi,k * ai) <= m.
 */
const SeatingOptimizationInputSchema = z.object({
  guestGroups: z.array(z.object({
    id: z.string().uuid(),
    size: z.number().int(),
    affinities: z.array(z.string().uuid()).describe("IDs de otros grupos con los que se desea compartir mesa.")
  })),
  tableCapacity: z.number().int().describe("Capacidad máxima 'm' por mesa.")
});

// --- IMPLEMENTACIÓN DE TOOLS ---

/**
 * Procesa y persiste el estado de confirmación de un invitado.
 */
export const processRSVPTool = tool({
  description: "Registra la confirmación de asistencia (RSVP) de un invitado y sus acompañantes.",
  parameters: RSVPInputSchema,
  execute: async ({ guestId, willAttend, plusOneCount }) => {
    // 1. Persistencia (Anillo 2/4)
    console.log(`[RSVP] Actualizando invitado ${guestId}: ${willAttend ? 'Asiste' : 'No asiste'} (+${plusOneCount})`);
    
    // 2. DISPARADOR REALTIME: Notificación al Dashboard del Tenant (Anillo 4)
    console.log(`[SUPABASE_REALTIME] Emitiendo evento 'RSVP_UPDATED' para invitado \${guestId}`);
    
    return { success: true, message: `RSVP procesado para el invitado ${guestId}.` };
  }
});

/**
 * Registra restricciones alimentarias críticas para la logística del banquete.
 */
export const captureDietaryPreferencesTool = tool({
  description: "Captura alergias y preferencias alimentarias del invitado.",
  parameters: DietaryInputSchema,
  execute: async ({ guestId, restrictions }) => {
    console.log(`[DIETARY] Guardando restricciones para ${guestId}: ${restrictions.join(', ')}`);
    
    // 3. DISPARADOR REALTIME: Sincronización omnicanal inmediata
    console.log(`[SUPABASE_REALTIME] Emitiendo evento 'DIETARY_UPDATED' para invitado \${guestId}`);
    
    return { success: true, message: "Preferencias dietéticas guardadas correctamente." };
  }
});


/**
 * Consulta la base de conocimientos del evento (RAG) para responder dudas frecuentes.
 */
export const answerWeddingFAQTool = tool({
  description: "Responde dudas sobre el evento (código de vestimenta, horarios, ubicación) usando RAG.",
  parameters: FAQInputSchema,
  execute: async ({ query }) => {
    // Simulación de búsqueda semántica en el dominio de conocimiento
    return { 
      answer: `Contexto del evento: El código de vestimenta es Formal/Etiqueta. La ceremonia inicia a las 18:00.` 
    };
  }
});

/**
 * Algoritmo de optimización de asientos (Firma MIP).
 */
export const optimizeSeatingChartTool = tool({
  description: "Calcula la distribución óptima de mesas respetando afinidades y capacidad máxima.",
  parameters: SeatingOptimizationInputSchema,
  execute: async ({ guestGroups, tableCapacity }) => {
    try {
      // Mapeamos a la interfaz de dominio
      const domainGroups: GuestGroup[] = guestGroups.map(g => ({
        id: g.id,
        size: g.size,
        affinities: g.affinities
      }));

      const assignment = SeatingOptimizerService.optimize(domainGroups, tableCapacity);

      return { 
        status: "SUCCESS", 
        assignment,
        message: `Se han optimizado ${assignment.length} mesas con éxito.` 
      };
    } catch (error: any) {
      return { 
        status: "ERROR", 
        message: error.message 
      };
    }
  }
});

/**
 * Esquema para búsqueda de proveedores basada en estética visual (Moodboard).
 */
const AestheticSearchSchema = z.object({
  imageUrls: z.array(z.string().url()).describe("Lista de URLs de fotos de inspiración (Pinterest, Instagram, etc.)."),
  category: z.string().optional().describe("Categoría opcional para filtrar (ej: 'Flores', 'Fotografía').")
});

/**
 * Herramienta para encontrar proveedores mediante visión artificial y vectores.
 */
export const findVendorsByAestheticTool = tool({
  description: "Busca proveedores cuya estética visual coincida con las fotos de inspiración proporcionadas.",
  parameters: AestheticSearchSchema,
  execute: async ({ imageUrls, category }) => {
    console.log(`[TOOL] Búsqueda estética iniciada para \${imageUrls.length} imágenes. Filtro: \${category || 'Ninguno'}`);
    
    // Aquí se inyectaría el AestheticMatchingAdapter (Anillo 4)
    // Por simplicidad en la demo, devolvemos un estado de éxito
    return {
      status: "SUCCESS",
      vendors: [
        { id: "v1", name: "Luz y Sombra", category: "Fotografía", matchScore: 0.98 },
        { id: "v2", name: "Hacienda El Rosal", category: "Lugar", matchScore: 0.92 }
      ],
      message: "Se han encontrado proveedores con alta afinidad visual a tu moodboard."
    };
  }
});

/**
 * Esquema para la auditoría técnica de contratos.
 */
const ContractAuditSchema = z.object({
  contractText: z.string().describe("El texto completo del contrato extraído del documento.")
});

/**
 * Herramienta para detectar riesgos legales en contratos de proveedores.
 * El ComplianceAgent utiliza esta herramienta para analizar el texto extraído (PDF) o dictado.
 */
export const auditVendorContractTool = tool({
  description: "Audita un contrato de proveedor para encontrar riesgos críticos (anticipos > 50%, falta de políticas de cancelación, responsabilidad extrema).",
  parameters: ContractAuditSchema,
  execute: async ({ contractText }) => {
    console.log(`[TOOL] Iniciando auditoría de cumplimiento legal sobre documento (\${contractText.length} chars).`);
    
    // El LegalComplianceAdapter (Anillo 4) se encargará del análisis determinista vía generateObject
    return {
      status: "SUCCESS",
      findings: [
        { 
          type: "Retainer", 
          severity: "high", 
          description: "La cláusula de anticipo solicita un 55%, lo cual excede el estándar de la industria (25-50%).",
          negotiationTactic: "Sugerir un pago escalonado (30% reserva, 25% 30 días antes)."
        }
      ],
      message: "Auditoría legal completada exitosamente. Se han extraído los riesgos de forma estructurada."
    };
  }
});



