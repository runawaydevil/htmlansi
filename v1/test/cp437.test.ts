import { describe, it, expect } from 'vitest';
import { decode } from '../src/cp437.js';

describe('cp437', () => {
  it('decodes space (0x20)', () => {
    expect(decode(new Uint8Array([0x20]))).toBe(' ');
  });

  it('decodes degree sign (0xF8 -> U+00B0)', () => {
    expect(decode(new Uint8Array([0xf8]))).toBe('\u00b0');
  });

  it('decodes capital E acute (0x90 -> U+00C9)', () => {
    expect(decode(new Uint8Array([0x90]))).toBe('\u00c9');
  });

  it('decodes box drawing and blocks', () => {
    expect(decode(new Uint8Array([0xdb]))).toBe('\u2588'); // FULL BLOCK
    expect(decode(new Uint8Array([0xc4]))).toBe('\u2500'); // LIGHT HORIZONTAL
  });

  it('decodes ASCII range unchanged', () => {
    const ascii = new Uint8Array(95);
    for (let i = 0; i < 95; i++) ascii[i] = 0x20 + i;
    expect(decode(ascii)).toBe(
      ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
    );
  });

  it('decodes empty buffer', () => {
    expect(decode(new Uint8Array(0))).toBe('');
  });
});
