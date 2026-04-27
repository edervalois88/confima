import { IDocumentExtractionService } from "../../domain/ports/PlanningPorts";
import { PDFParse } from "pdf-parse";

/**
 * @fileoverview Adaptador de infraestructura para parseo de PDFs.
 * Anillo 4: Infraestructura.
 */

export class PdfParserAdapter implements IDocumentExtractionService {
  /**
   * Extrae texto plano de un buffer binario de PDF.
   */
  public async extractTextFromBuffer(buffer: ArrayBuffer, mimeType: string): Promise<string> {
    if (mimeType !== "application/pdf") {
      throw new Error("Formato no soportado. Por favor, asegúrate de que sea un PDF sin contraseña.");
    }

    try {
      const parser = new PDFParse({ data: Buffer.from(buffer) });
      const data = await parser.getText();
      await parser.destroy();
      console.log(`[PDF_PARSER] Texto extraido exitosamente. (${data.text.length} caracteres)`);
      return data.text;
    } catch (error) {
      console.error("[PDF_PARSER_ERROR]", error);
      throw new Error("No he podido leer este documento. Por favor, asegúrate de que sea un PDF sin contraseña.");
    }
  }
}
