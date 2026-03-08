import { describe, it, expect } from 'vitest';
import { scanDir } from '../src/scan.js';
import { join } from 'path';

const SUPPORTED = new Set(['ans', 'asc', 'txt', 'nfo', 'diz', 'pcb', 'bin', 'xb', 'adf', 'idf', 'tnd', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'avif', 'svg', 'pdf']);

describe('scan', () => {
  it('returns array', async () => {
    const entries = await scanDir(join(process.cwd(), 'in'));
    expect(Array.isArray(entries)).toBe(true);
  });

  it('entries have relativePath and absolutePath', async () => {
    const entries = await scanDir(join(process.cwd(), 'in'));
    for (const e of entries) {
      expect(typeof e.relativePath).toBe('string');
      expect(typeof e.absolutePath).toBe('string');
      const ext = e.relativePath.replace(/^.*\./, '').toLowerCase();
      expect(SUPPORTED.has(ext)).toBe(true);
    }
  });
});
