import { Buffer } from 'node:buffer';

/**
 * Extract text from PDF binary buffer. Uses `pdf-parse` if available.
 * Returns the concatenated text of the PDF.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    // lazy import to avoid hard dependency if not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = await import('pdf-parse');
    const result = await (pdfParse.default ?? pdfParse)(buffer);
    return (result?.text ?? '').trim();
  } catch (err) {
    throw new Error('pdf-parse no está disponible. Instala `pdf-parse` para habilitar extracción de PDFs.');
  }
}
