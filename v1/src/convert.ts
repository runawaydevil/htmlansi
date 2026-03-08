import { detect } from './detect.js';
import { ansiStreamToBuffer } from './backends/ansi-stream.js';
import { binToGrid } from './backends/bin.js';
import { xbinToGrid } from './backends/xbin.js';
import { adfToGrid } from './backends/adf.js';
import { idfToGrid } from './backends/idf.js';
import { tundraToGrid } from './backends/tundra.js';
import { fallbackToGrid } from './backends/fallback.js';
import { bufferToHtml, gridToHtml } from './html.js';
import type { ConvertOptions, ConvertResult, SourceFormat } from './types.js';

function useBinaryBackend(format: SourceFormat): boolean {
  return format === 'bin' || format === 'xb' || format === 'adf' || format === 'idf' || format === 'tnd' || format === 'unknown';
}

export async function convertToHtml(
  rawBytes: Uint8Array,
  options: ConvertOptions = {}
): Promise<ConvertResult> {
  const detection = detect(rawBytes, options.filename);
  const format = options.format ?? detection.format;
  const cols = options.cols ?? detection.hints.width;
  const rows = options.rows ?? detection.hints.height;

  if (useBinaryBackend(format)) {
    const opts = { width: cols, height: rows };
    const { grid, sauce } =
      format === 'bin' ? binToGrid(rawBytes, opts) :
      format === 'xb' ? xbinToGrid(rawBytes) :
      format === 'adf' ? adfToGrid(rawBytes) :
      format === 'idf' ? idfToGrid(rawBytes) :
      format === 'tnd' ? tundraToGrid(rawBytes) :
      fallbackToGrid(rawBytes, { width: cols, sourceFormat: 'ans' });
    const html = gridToHtml(grid, {
      ...options,
      metadata: options.includeMetadata !== false ? sauce : undefined,
      fontUrl: options.fontUrl,
    });
    return { html, metadata: sauce };
  }

  const { buffer, sauce } = await ansiStreamToBuffer(rawBytes, { cols, rows });
  const html = bufferToHtml(buffer, {
    ...options,
    metadata: options.includeMetadata !== false ? sauce : undefined,
  });
  return { html, metadata: sauce };
}
