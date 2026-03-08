import { join, relative, dirname, extname } from 'path';

export function rel(from: string, to: string): string {
  return relative(from, to).replace(/\\/g, '/');
}

export function outPath(inDir: string, outDir: string, inputPath: string): string {
  const relPath = rel(inDir, inputPath);
  const base = relPath.replace(/\.[^.]+$/, '');
  return join(outDir, base + '.html');
}

export function getExt(path: string): string {
  return extname(path).toLowerCase().replace(/^\./, '');
}

export async function ensureDir(path: string): Promise<void> {
  const { mkdir } = await import('fs/promises');
  await mkdir(dirname(path), { recursive: true });
}
