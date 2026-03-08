import { describe, it, expect } from 'vitest';
import { convertToHtml } from '../src/convert.js';
import { GENERATOR_SIGNATURE } from '../src/export/html.js';

const SIGNATURE_EXACT = 'made by runv.sh github: runawaydebil';

describe('convert', () => {
  it('converts simple ANSI SGR to HTML with colored span', async () => {
    const raw = new Uint8Array([
      0x1b, 0x5b, 0x33, 0x31, 0x6d, 0x48, 0x69, 0x1b, 0x5b, 0x30, 0x6d,
    ]);
    const result = await convertToHtml(raw);
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('<pre>');
    expect(result.html).toContain('Hi');
    expect(result.html).toMatch(/color:|background:/);
    expect(result.metadata).toBeNull();
  });

  it('includes generator signature in HTML source (meta and data-generator)', async () => {
    const raw = new Uint8Array([0x48, 0x69]);
    const result = await convertToHtml(raw);
    expect(GENERATOR_SIGNATURE).toBe(SIGNATURE_EXACT);
    expect(result.html).toContain(SIGNATURE_EXACT);
    expect(result.html).toContain('name="generator" content="' + SIGNATURE_EXACT + '"');
    expect(result.html).toContain('data-generator="' + SIGNATURE_EXACT + '"');
  });

  it('includes signature with theme light', async () => {
    const raw = new Uint8Array([0x48, 0x69]);
    const result = await convertToHtml(raw, { theme: 'light' });
    expect(result.html).toContain(SIGNATURE_EXACT);
  });

  it('converts empty buffer to minimal HTML', async () => {
    const result = await convertToHtml(new Uint8Array(0));
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('<pre>');
    expect(result.html).toContain(SIGNATURE_EXACT);
  });
});
