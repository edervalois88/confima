/**
 * @fileoverview Conjunto de Datos Dorado (Golden Dataset) para evaluaciones de agentes.
 * Anillo 1 / Infraestructura de Pruebas.
 */

export interface EvaluationCase {
  id: string;
  input: string;
  expectedIntent: string;
  expectedTools?: string[];
  groundTruth: string;
}

export const GoldenDataset: EvaluationCase[] = [
  {
    id: "RSVP_COMPLEX",
    input: "Confirmamos mi esposa y yo, pero ella es celíaca y yo soy alérgico a los frutos secos.",
    expectedIntent: "RSVP_DIETARY",
    expectedTools: ["processRSVPTool", "captureDietaryPreferencesTool"],
    groundTruth: "El agente debe registrar 2 asistentes y anotar las restricciones de celiaquía y frutos secos."
  },
  {
    id: "CONTRACT_RISK",
    input: "El fotógrafo pide un 60% de anticipo y no tiene política de cancelación. ¿Es seguro?",
    expectedIntent: "COMPLIANCE_AUDIT",
    expectedTools: ["auditVendorContractTool"],
    groundTruth: "El agente debe detectar riesgo alto por anticipo excesivo (>50%) y falta de cláusula de cancelación."
  },
  {
    id: "SEATING_CONFLICT",
    input: "Organiza las mesas. Mi tía Marta no puede estar con mi primo Juan, pero ambos deben estar cerca de la pista.",
    expectedIntent: "SEATING_OPTIMIZATION",
    expectedTools: ["optimizeSeatingChartTool"],
    groundTruth: "El agente debe invocar la optimización respetando la restricción de des-afinidad entre Marta y Juan."
  }
];
