import type { InputKind } from '../types.js';

export function analyzeRaster(_preprocessResult: unknown): { kind: InputKind; textCoverage?: number } {
  return { kind: 'raster-photo' };
}
