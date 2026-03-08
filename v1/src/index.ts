import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { convertToHtml } from './convert.js';
import type { ConvertOptions, ConvertResult } from './types.js';

export type {
  ConvertOptions,
  ConvertResult,
  SauceRecord,
  DetectionResult,
  DetectionHints,
  SourceFormat,
  DetectionConfidence,
  Grid,
  Cell,
} from './types.js';
export { convertToHtml } from './convert.js';
export { readSauce, parseSauceRecord } from './sauce.js';
export { decode as cp437Decode } from './cp437.js';
export { normalizePabloDraw } from './pablodraw.js';
export { GENERATOR_SIGNATURE } from './export/html.js';
export { detect } from './detect.js';
export { createEmptyGrid, setCell, getCell, getDimensions, addRenderWarning } from './grid.js';

export async function convertFile(
  inputPath: string,
  options: ConvertOptions = {},
  outPath?: string
): Promise<ConvertResult> {
  const raw = await readFile(inputPath);
  const result = await convertToHtml(new Uint8Array(raw), options);
  if (outPath) {
    await mkdir(dirname(outPath), { recursive: true }).catch(() => {});
    await writeFile(outPath, result.html, 'utf-8');
  }
  return result;
}

export async function convertBuffer(
  buffer: Buffer | Uint8Array,
  options: ConvertOptions = {}
): Promise<ConvertResult> {
  const bytes = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
  return convertToHtml(bytes, options);
}

export async function convertDir(
  inputDir: string,
  outDir: string,
  options: ConvertOptions = {}
): Promise<ConvertResult[]> {
  await mkdir(outDir, { recursive: true });
  const entries = await readdir(inputDir, { withFileTypes: true });
  const results: ConvertResult[] = [];
  for (const e of entries) {
    if (!e.isFile() || extname(e.name).toLowerCase() !== '.ans') continue;
    const inp = join(inputDir, e.name);
    const out = join(outDir, basename(e.name, extname(e.name)) + '.html');
    const r = await convertFile(inp, options, out);
    results.push(r);
  }
  return results;
}
