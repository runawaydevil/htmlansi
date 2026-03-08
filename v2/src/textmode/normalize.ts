import { readSauce } from './sauce.js';
import { decode as cp437Decode } from './cp437.js';
import { normalizePabloDraw } from './pablodraw.js';
import type { SauceRecord } from '../types.js';

export function normalizeInput(buffer: Uint8Array): { content: string; sauce: SauceRecord | null } {
  const { content: raw, sauce } = readSauce(buffer);
  const decoded = cp437Decode(raw);
  const content = normalizePabloDraw(decoded);
  return { content, sauce };
}
