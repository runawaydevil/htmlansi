import { vectorFallbackToHtml } from './fallback.js';

export async function pdfToHtml(_inputPath: string): Promise<{ html: string }> {
  return { html: vectorFallbackToHtml({ message: 'PDF not implemented' }) };
}
