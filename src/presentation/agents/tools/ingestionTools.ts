import { z } from 'zod';
import { tool } from 'ai';

/**
 * @fileoverview Herramientas de Ingesta Masiva y Multimodal.
 * Anillo 2: Casos de Uso del IngestionAgent.
 */

const ExcelIngestionSchema = z.object({
  rawData: z.array(z.record(z.unknown())).describe("Matriz de objetos extraída de las celdas de Excel."),
  tenantId: z.string().uuid()
});

const WhatsAppContactSchema = z.object({
  vCard: z.string().describe("Contenido en bruto de la tarjeta de contacto (vCard)."),
  tenantId: z.string().uuid()
});

/**
 * Herramienta para parsear y normalizar listas de invitados desde Excel.
 * Utiliza un analizador estructural antes de la persistencia.
 */
export const parseExcelGuestListTool = tool({
  description: "Transforma datos crudos de Excel en perfiles de invitados normalizados con validación Zod.",
  parameters: ExcelIngestionSchema,
  execute: async ({ rawData, tenantId }) => {
    console.info(`[INGESTION] Procesando ${rawData.length} filas para Tenant ${tenantId}`);
    
    // Simulación de mapeo semántico estructural
    const guests = rawData.map(row => ({
      name: row.nombre || row.name || "Sin nombre",
      phone: String(row.telefono || row.phone || "").replace(/\D/g, ''),
      source: 'EXCEL'
    }));

    return { 
      count: guests.length, 
      status: "STAGED", 
      message: "Lista analizada. Lista para confirmación de persistencia." 
    };
  }
});

/**
 * Procesa tarjetas de contacto compartidas por WhatsApp normalizando formatos telefónicos.
 */
export const processWhatsAppContactTool = tool({
  description: "Normaliza e ingresa un contacto compartido vía WhatsApp (vCard).",
  parameters: WhatsAppContactSchema,
  execute: async ({ vCard, tenantId }) => {
    // Regex simplificada para extraer TEL de vCard
    const phoneMatch = vCard.match(/TEL;.*:(.*)/);
    const rawPhone = phoneMatch ? phoneMatch[1] : "";
    const cleanPhone = rawPhone.replace(/\D/g, '');

    console.info(`[WHATSAPP_INGESTION] Contacto detectado: ${cleanPhone} para Tenant ${tenantId}`);
    
    return { 
      phone: cleanPhone, 
      status: "NORMALIZED",
      message: "Contacto normalizado y listo para ser añadido al Guest Journey."
    };
  }
});
