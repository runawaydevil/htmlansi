import { readFile, writeFile, readdir } from 'fs/promises';
import { join, extname as pathExtname, basename as pathBasename } from 'path';

export interface FontEntry {
  name: string;
  file: string;
  codepage?: number;
  bits?: number;
}

export interface FontManifest {
  fonts: FontEntry[];
}

const MANIFEST_FILENAME = 'font-manifest.json';

export async function readManifest(fontsDir: string): Promise<FontManifest> {
  const path = join(fontsDir, MANIFEST_FILENAME);
  try {
    const raw = await readFile(path, 'utf-8');
    const data = JSON.parse(raw) as FontManifest;
    return Array.isArray(data.fonts) ? data : { fonts: [] };
  } catch {
    return { fonts: [] };
  }
}

export async function writeManifest(fontsDir: string, manifest: FontManifest): Promise<void> {
  const path = join(fontsDir, MANIFEST_FILENAME);
  await writeFile(path, JSON.stringify(manifest, null, 2), 'utf-8');
}

const FONT_EXT = ['.woff2', '.woff', '.ttf', '.otf'];

export async function rebuildManifest(fontsDir: string): Promise<FontManifest> {
  const entries = await readdir(fontsDir, { withFileTypes: true }).catch(() => []);
  const fonts: FontEntry[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = pathExtname(e.name).toLowerCase();
    if (!FONT_EXT.includes(ext)) continue;
    const base = pathBasename(e.name, ext);
    fonts.push({ name: base, file: e.name });
  }
  const manifest: FontManifest = { fonts };
  await writeManifest(fontsDir, manifest);
  return manifest;
}
