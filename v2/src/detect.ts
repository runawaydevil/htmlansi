import { readFile } from 'fs/promises';
import type { FileDetectionResult, InputKind } from './types.js';
import { detect as textmodeDetect } from './textmode/detect.js';

const XBIN_MAGIC = new Uint8Array([0x58, 0x42, 0x49, 0x4e, 0x1a]);
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff]);
const GIF_MAGIC = new Uint8Array([0x47, 0x49, 0x46]);
const WEBP_RIFF = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
const BMP_MAGIC = new Uint8Array([0x42, 0x4d]);
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

function matchMagic(buf: Uint8Array, magic: Uint8Array): boolean {
  if (buf.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (buf[i] !== magic[i]) return false;
  }
  return true;
}

function extFromPath(path: string): string {
  return path.replace(/^.*\./, '').toLowerCase();
}

const TEXTMODE_EXT = new Set(['ans', 'asc', 'txt', 'nfo', 'diz', 'pcb', 'bin', 'xb', 'adf', 'idf', 'tnd']);
const RASTER_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'avif']);
const VECTOR_EXT = new Set(['svg', 'pdf']);

function isSvgByContent(buf: Uint8Array): boolean {
  const s = new TextDecoder('utf-8', { fatal: false }).decode(buf.subarray(0, Math.min(512, buf.length)));
  return /<svg[\s>]/i.test(s) || /<\?xml[\s\S]*<svg/i.test(s);
}

export async function detectFile(inputPath: string, buffer?: Uint8Array): Promise<FileDetectionResult> {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let kind: InputKind = 'unknown';
  let format = '';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let width: number | undefined;
  let height: number | undefined;
  const ext = extFromPath(inputPath);

  const buf = buffer ?? await readFile(inputPath);
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buf);

  if (matchMagic(bytes, XBIN_MAGIC)) {
    kind = 'textmode';
    format = 'xb';
    confidence = 'high';
    reasons.push('magic_bytes');
  } else if (matchMagic(bytes, PNG_MAGIC)) {
    kind = 'raster-photo';
    format = 'png';
    confidence = 'high';
    reasons.push('magic_bytes');
  } else if (matchMagic(bytes, JPEG_MAGIC)) {
    kind = 'raster-photo';
    format = 'jpeg';
    confidence = 'high';
    reasons.push('magic_bytes');
  } else if (matchMagic(bytes, GIF_MAGIC)) {
    kind = 'raster-photo';
    format = 'gif';
    confidence = 'high';
    reasons.push('magic_bytes');
  } else if (bytes.length >= 12 && matchMagic(bytes.subarray(0, 4), WEBP_RIFF) && bytes[8] === 0x57 && bytes[9] === 0x45) {
    kind = 'raster-photo';
    format = 'webp';
    confidence = 'high';
    reasons.push('magic_bytes');
  } else if (matchMagic(bytes, BMP_MAGIC)) {
    kind = 'raster-photo';
    format = 'bmp';
    confidence = 'high';
    reasons.push('magic_bytes');
  } else if (matchMagic(bytes, PDF_MAGIC)) {
    kind = 'vector';
    format = 'pdf';
    confidence = 'high';
    reasons.push('magic_bytes');
  } else if (isSvgByContent(bytes)) {
    kind = 'vector';
    format = 'svg';
    confidence = 'high';
    reasons.push('content_heuristic');
  } else if (TEXTMODE_EXT.has(ext)) {
    const tm = textmodeDetect(bytes, inputPath);
    kind = 'textmode';
    format = tm.format;
    confidence = tm.confidence;
    reasons.push(...tm.reasons);
    if (tm.hints.width) width = tm.hints.width;
    if (tm.hints.height) height = tm.hints.height;
  } else if (RASTER_EXT.has(ext)) {
    kind = 'raster-photo';
    format = ext;
    confidence = 'medium';
    reasons.push('extension');
  } else if (VECTOR_EXT.has(ext)) {
    kind = 'vector';
    format = ext;
    confidence = 'medium';
    reasons.push('extension');
  } else {
    const tm = textmodeDetect(bytes, inputPath);
    if (tm.format !== 'unknown' || tm.reasons.length > 0) {
      kind = 'textmode';
      format = tm.format;
      confidence = tm.confidence === 'high' ? 'medium' : 'low';
      reasons.push('content_heuristic', ...tm.reasons);
    } else {
      warnings.push('unknown format, fallback may be used');
    }
  }

  if (format === '' && ext) {
    format = ext;
    if (reasons.indexOf('extension') === -1) reasons.push('extension');
  }

  return {
    inputPath,
    ext: ext || undefined,
    kind,
    format,
    confidence,
    reasons,
    width,
    height,
    warnings,
  };
}
