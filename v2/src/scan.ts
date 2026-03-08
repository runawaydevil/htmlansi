import { readdir } from 'fs/promises';
import { join } from 'path';

const TEXTMODE_EXT = new Set(['ans', 'asc', 'txt', 'nfo', 'diz', 'pcb', 'bin', 'xb', 'adf', 'idf', 'tnd']);
const RASTER_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'avif']);
const VECTOR_EXT = new Set(['svg', 'pdf']);

const SUPPORTED_EXT = new Set([...TEXTMODE_EXT, ...RASTER_EXT, ...VECTOR_EXT]);

export interface ScanEntry {
  relativePath: string;
  absolutePath: string;
}

export async function scanDir(
  inDir: string,
  options: { recursive?: boolean } = {}
): Promise<ScanEntry[]> {
  const result: ScanEntry[] = [];
  const recursive = options.recursive !== false;

  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const full = join(dir, e.name);
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (recursive) await walk(full, rel);
        continue;
      }
      if (!e.isFile()) continue;
      const ext = e.name.replace(/^.*\./, '').toLowerCase();
      if (!SUPPORTED_EXT.has(ext)) continue;
      result.push({ relativePath: rel.replace(/\\/g, '/'), absolutePath: full });
    }
  }

  await walk(inDir, '');
  return result;
}
