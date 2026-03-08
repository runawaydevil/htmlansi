import { describe, it, expect } from 'vitest';
import { route } from '../src/router.js';

describe('router', () => {
  it('routes textmode to textmode', () => {
    expect(route({ kind: 'textmode', format: 'ans', confidence: 'high', reasons: [], warnings: [], inputPath: '' })).toBe('textmode');
  });
  it('routes raster-photo to raster-fallback', () => {
    expect(route({ kind: 'raster-photo', format: 'png', confidence: 'high', reasons: [], warnings: [], inputPath: '' })).toBe('raster-fallback');
  });
  it('routes raster-text-heavy to raster-reconstruct', () => {
    expect(route({ kind: 'raster-text-heavy', format: 'png', confidence: 'high', reasons: [], warnings: [], inputPath: '' })).toBe('raster-reconstruct');
  });
  it('routes vector to vector', () => {
    expect(route({ kind: 'vector', format: 'svg', confidence: 'high', reasons: [], warnings: [], inputPath: '' })).toBe('vector');
  });
  it('routes unknown to unknown', () => {
    expect(route({ kind: 'unknown', format: '', confidence: 'low', reasons: [], warnings: [], inputPath: '' })).toBe('unknown');
  });
});
