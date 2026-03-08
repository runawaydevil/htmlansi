import type { FileDetectionResult, PipelineId } from './types.js';

export function route(detection: FileDetectionResult): PipelineId {
  switch (detection.kind) {
    case 'textmode':
      return 'textmode';
    case 'raster-text-heavy':
      return 'raster-reconstruct';
    case 'raster-mixed':
      return 'raster-reconstruct';
    case 'raster-photo':
      return 'raster-fallback';
    case 'vector':
      return 'vector';
    default:
      return 'unknown';
  }
}
