import { describe, it, expect } from 'vitest';
import { detect } from '../src/detect.js';

describe('detect', () => {
  it('detects ANSI by escape sequences', () => {
    const raw = new Uint8Array([0x1b, 0x5b, 0x33, 0x31, 0x6d, 0x48, 0x69]);
    const r = detect(raw);
    expect(r.format).toBe('ans');
    expect(r.reasons).toContain('ansi_escapes');
  });

  it('detects XBin by magic bytes', () => {
    const magic = new Uint8Array([0x58, 0x42, 0x49, 0x4e, 0x1a]);
    const raw = new Uint8Array(magic.length + 100);
    raw.set(magic);
    const r = detect(raw);
    expect(r.format).toBe('xb');
    expect(r.confidence).toBe('high');
    expect(r.reasons).toContain('magic_bytes');
  });

  it('detects by extension when no magic or sauce', () => {
    const raw = new Uint8Array(100).fill(0x20);
    const r = detect(raw, 'art.bin');
    expect(r.format).toBe('bin');
    expect(r.reasons).toContain('extension');
  });

  it('returns unknown then fallback for plain bytes without extension', () => {
    const raw = new Uint8Array([0x48, 0x69, 0x0a]);
    const r = detect(raw);
    expect(['ans', 'unknown']).toContain(r.format);
  });
});
