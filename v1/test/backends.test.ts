import { describe, it, expect } from 'vitest';
import { convertToHtml } from '../src/convert.js';
import { GENERATOR_SIGNATURE } from '../src/export/html.js';

const SIGNATURE_EXACT = 'made by runv.sh github: runawaydebil';

describe('backends', () => {
  it('converts BIN (char+attr pairs) to HTML with signature', async () => {
    const width = 10;
    const height = 2;
    const pairs: number[] = [];
    for (let i = 0; i < width * height; i++) {
      pairs.push(0x48 + (i % 2), 0x07);
    }
    const raw = new Uint8Array(pairs);
    const result = await convertToHtml(raw, { format: 'bin', filename: 'a.bin' });
    expect(result.html).toContain(SIGNATURE_EXACT);
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('H');
  });

  it('converts XBin magic header to HTML', async () => {
    const magic = new Uint8Array([0x58, 0x42, 0x49, 0x4e, 0x1a]);
    const width = 5;
    const height = 2;
    const header = new Uint8Array(11);
    header.set(magic);
    header[5] = width;
    header[6] = 0;
    header[7] = height;
    header[8] = 0;
    header[9] = 16;
    header[10] = 0;
    const data = new Uint8Array(width * height * 2);
    for (let i = 0; i < width * height; i++) {
      data[i * 2] = 0x41 + (i % 5);
      data[i * 2 + 1] = 0x0e;
    }
    const raw = new Uint8Array(header.length + data.length);
    raw.set(header);
    raw.set(data, header.length);
    const result = await convertToHtml(raw, { format: 'xb' });
    expect(result.html).toContain(SIGNATURE_EXACT);
    expect(result.html).toContain('A');
  });

  it('fallback (unknown) produces HTML with signature', async () => {
    const raw = new Uint8Array([0x48, 0x69, 0x0a]);
    const result = await convertToHtml(raw, { format: 'unknown' });
    expect(result.html).toContain(SIGNATURE_EXACT);
    expect(result.html).toContain('Hi');
  });
});
