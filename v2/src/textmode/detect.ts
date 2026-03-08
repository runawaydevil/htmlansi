import { readSauce } from './sauce.js';
import type { SauceRecord } from '../types.js';
import type { SourceFormat, DetectionConfidence, DetectionHints } from '../types.js';

const SAUCE_RECORD_SIZE = 128;
const XBIN_MAGIC = new Uint8Array([0x58, 0x42, 0x49, 0x4e, 0x1a]);

function hasSauce(buffer: Uint8Array): boolean {
  if (buffer.length < SAUCE_RECORD_SIZE) return false;
  const last = buffer.subarray(buffer.length - SAUCE_RECORD_SIZE);
  const id = String.fromCharCode(last[0]!, last[1]!, last[2]!, last[3]!, last[4]!);
  return id === 'SAUCE';
}

function getSauce(buffer: Uint8Array): SauceRecord | null {
  const { sauce } = readSauce(buffer);
  return sauce;
}

function detectByMagic(buffer: Uint8Array): { format: SourceFormat; confidence: DetectionConfidence } | null {
  if (buffer.length >= XBIN_MAGIC.length) {
    let match = true;
    for (let i = 0; i < XBIN_MAGIC.length; i++) {
      if (buffer[i] !== XBIN_MAGIC[i]) {
        match = false;
        break;
      }
    }
    if (match) return { format: 'xb', confidence: 'high' };
  }
  return null;
}

function detectBySauce(sauce: SauceRecord): { format: SourceFormat; confidence: DetectionConfidence; hints: Partial<DetectionHints> } {
  const dt = sauce.dataType;
  const ft = sauce.fileType;
  const hints: Partial<DetectionHints> = {
    width: sauce.tInfo1 > 0 ? sauce.tInfo1 : undefined,
    height: sauce.tInfo2 > 0 ? sauce.tInfo2 : undefined,
    codepage: sauce.tFlags & 1 ? 437 : undefined,
  };
  if (dt === 0 && ft === 0) return { format: 'ans', confidence: 'high', hints };
  if (dt === 1 && ft === 0) return { format: 'ans', confidence: 'high', hints };
  if (dt === 0 && ft === 1) return { format: 'asc', confidence: 'high', hints };
  if (dt === 5) return { format: 'bin', confidence: 'high', hints };
  if (dt === 4) return { format: 'xb', confidence: 'high', hints };
  return { format: 'ans', confidence: 'medium', hints };
}

function detectByExtension(filename: string): SourceFormat | null {
  const ext = filename.replace(/^.*\./, '').toLowerCase();
  const map: Record<string, SourceFormat> = {
    ans: 'ans', asc: 'asc', txt: 'txt', nfo: 'nfo', diz: 'diz',
    pcb: 'pcb', bin: 'bin', xb: 'xb', adf: 'adf', idf: 'idf', tnd: 'tnd',
  };
  return map[ext] ?? null;
}

function hasAnsiEscapes(content: Uint8Array): boolean {
  for (let i = 0; i < content.length - 1; i++) {
    if (content[i] === 0x1b && (content[i + 1] === 0x5b || content[i + 1] === 0x28 || content[i + 1] === 0x29)) return true;
  }
  return false;
}

function heuristicBin(content: Uint8Array): boolean {
  if (content.length < 2) return false;
  const pairs = Math.floor(content.length / 2);
  let attrCount = 0;
  for (let i = 0; i < Math.min(pairs, 200); i++) {
    const attr = content[i * 2 + 1]!;
    if (attr <= 0x8f || (attr >= 0x90 && attr <= 0x9f)) attrCount++;
  }
  return attrCount > 0.7 * Math.min(pairs, 200);
}

export interface TextmodeDetectionResult {
  format: SourceFormat;
  confidence: DetectionConfidence;
  reasons: string[];
  sauce?: SauceRecord | null;
  hints: DetectionHints;
}

export function detect(buffer: Uint8Array, filename?: string): TextmodeDetectionResult {
  const reasons: string[] = [];
  let format: SourceFormat = 'unknown';
  let confidence: DetectionConfidence = 'low';
  const hints: DetectionHints = {};
  let sauce: SauceRecord | null = null;

  const magicResult = detectByMagic(buffer);
  if (magicResult) {
    format = magicResult.format;
    confidence = magicResult.confidence;
    reasons.push('magic_bytes');
    sauce = getSauce(buffer);
    if (sauce) {
      hints.width = sauce.tInfo1 > 0 ? sauce.tInfo1 : undefined;
      hints.height = sauce.tInfo2 > 0 ? sauce.tInfo2 : undefined;
    }
    return { format, confidence, reasons, sauce: sauce ?? undefined, hints };
  }

  if (hasSauce(buffer)) {
    sauce = getSauce(buffer)!;
    const sauceDetect = detectBySauce(sauce);
    format = sauceDetect.format;
    confidence = sauceDetect.confidence;
    reasons.push('sauce');
    Object.assign(hints, sauceDetect.hints);
  }

  const extFormat = filename ? detectByExtension(filename) : null;
  if (extFormat && format === 'unknown') {
    format = extFormat;
    confidence = 'medium';
    reasons.push('extension');
  }

  const { content } = readSauce(buffer);
  if (format === 'unknown' || confidence === 'low') {
    if (hasAnsiEscapes(content)) {
      format = format === 'unknown' ? 'ans' : format;
      confidence = 'high';
      reasons.push('ansi_escapes');
    }
  }

  if (format === 'bin' || format === 'unknown') {
    if (heuristicBin(content) && content.length % 2 === 0) {
      format = 'bin';
      if (reasons.indexOf('sauce') === -1) reasons.push('char_attr_pairs');
      confidence = confidence === 'low' ? 'medium' : confidence;
    }
  }

  if (format === 'unknown' && extFormat) {
    format = extFormat;
    confidence = 'low';
    if (reasons.indexOf('extension') === -1) reasons.push('extension');
  }

  if (format === 'unknown') {
    format = 'ans';
    confidence = 'low';
    reasons.push('fallback_default_ans');
  }

  return { format, confidence, reasons, sauce: sauce ?? undefined, hints };
}
