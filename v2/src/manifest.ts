import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import type { ConversionManifestEntry } from './types.js';

export async function writeManifest(outDir: string, entries: ConversionManifestEntry[]): Promise<string> {
  const path = join(outDir, 'manifest.json');
  await writeFile(path, JSON.stringify(entries, null, 2), 'utf-8');
  return path;
}

export async function readManifest(outDir: string): Promise<ConversionManifestEntry[]> {
  const path = join(outDir, 'manifest.json');
  try {
    const raw = await readFile(path, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
