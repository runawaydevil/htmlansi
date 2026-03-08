import { svgToHtml } from './svg.js';
import { vectorFallbackToHtml } from './fallback.js';

export async function runVector(inputPath: string): Promise<{ html: string }> {
  const ext = inputPath.replace(/^.*\./, '').toLowerCase();
  if (ext === 'svg') {
    return svgToHtml(inputPath);
  }
  return { html: vectorFallbackToHtml({ message: 'PDF or unsupported vector', link: inputPath }) };
}
