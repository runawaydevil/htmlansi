import { fallbackToGrid } from './fallback.js';
import type { Grid } from '../types.js';
import type { SauceRecord } from '../types.js';

export function pcboardToGrid(rawBytes: Uint8Array): { grid: Grid; sauce: SauceRecord | null } {
  return fallbackToGrid(rawBytes, { sourceFormat: 'pcb' });
}
