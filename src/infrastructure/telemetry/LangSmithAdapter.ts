/**
 * @fileoverview Adaptador para LangSmith (Observabilidad y Trazabilidad AI).
 * Anillo 4: Infraestructura.
 */

export interface TraceMetadata {
  correlationId: string;
  tenantId: string;
  source: string;
}

export class LangSmithAdapter {
  private static isLoggingEnabled = process.env.LANGSMITH_LOGGING === 'true';

  /**
   * Registra el inicio de una traza para un agente o nodo.
   */
  public static logNodeExecution(nodeName: string, metadata: TraceMetadata, inputs: unknown) {
    if (!this.isLoggingEnabled) return;

    console.log(`[LANGSMITH_TRACE] Node: ${nodeName} | ID: ${metadata.correlationId} | Tenant: ${metadata.tenantId}`);
    console.debug(`[LANGSMITH_INPUTS]`, JSON.stringify(inputs));
  }

  /**
   * Registra la salida y el uso de tokens (Telemetría de Costos).
   */
  public static logNodeOutput(nodeName: string, output: unknown, tokens: number = 0) {
    if (!this.isLoggingEnabled) return;

    console.log(`[LANGSMITH_OUTPUT] Node: ${nodeName} | Tokens: ${tokens}`);
    console.debug(`[LANGSMITH_OUTPUT_PAYLOAD]`, JSON.stringify(output));
    // En producción aquí se enviaría la traza a la API de LangSmith
  }

  /**
   * Captura el razonamiento (Chain of Thought) de una llamada a herramienta.
   */
  public static logToolCall(toolName: string, rationale: string, params: unknown) {
    if (!this.isLoggingEnabled) return;

    console.info(`[LANGSMITH_TOOL] Tool: ${toolName} | Rationale: ${rationale}`);
    console.debug(`[LANGSMITH_TOOL_PARAMS]`, JSON.stringify(params));
  }
}
