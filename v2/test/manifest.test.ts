import { describe, it, expect } from 'vitest';
import { writeManifest, readManifest } from '../src/manifest.js';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('manifest', () => {
  it('writes and reads manifest', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'htmlansi-'));
    try {
      const entries = [
        { source: 'a.ans', dest: 'a.html', kind: 'textmode' as const, pipeline: 'textmode', format: 'ans', confidence: 'high', warnings: [] },
      ];
      const path = await writeManifest(dir, entries);
      expect(path).toContain('manifest.json');
      const read = await readManifest(dir);
      expect(read).toHaveLength(1);
      expect(read[0]!.source).toBe('a.ans');
      expect(read[0]!.dest).toBe('a.html');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('returns empty array for missing manifest', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'htmlansi2-'));
    try {
      const read = await readManifest(dir);
      expect(read).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
