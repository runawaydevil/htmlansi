import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readManifest } from './font-manifest.js';
import type { FontEntry, FontManifest } from './font-manifest.js';
import type { DetectionHints } from './types.js';

const DEFAULT_FONTS_DIRNAME = 'fonts';

let projectRoot: string | null = null;

function getProjectRoot(): string {
  if (projectRoot) return projectRoot;
  const __filename = fileURLToPath(import.meta.url);
  const distDir = dirname(__filename);
  projectRoot = join(distDir, '..');
  return projectRoot;
}

export function getFontsDir(): string {
  if (process.env['HTMLANSI_FONTS_DIR']) return process.env['HTMLANSI_FONTS_DIR'];
  return join(getProjectRoot(), DEFAULT_FONTS_DIRNAME);
}

export async function listFonts(fontsDir?: string): Promise<FontEntry[]> {
  const dir = fontsDir ?? getFontsDir();
  const manifest = await readManifest(dir);
  return manifest.fonts;
}

export function selectFont(
  hints: DetectionHints,
  cliFont: string | null | undefined
): string | null {
  if (cliFont) return cliFont;
  if (hints.font) return hints.font;
  return null;
}

export function getFontFilePath(manifest: FontManifest, fontName: string): string | null {
  const entry = manifest.fonts.find((f) => f.name === fontName);
  return entry ? entry.file : null;
}
