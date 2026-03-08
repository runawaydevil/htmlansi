#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { getFontsDir } from './textmode/fonts.js';
import { rebuildManifest } from './textmode/font-manifest.js';
import { convertToHtml } from './textmode/convert.js';
import { detectFile } from './detect.js';
import { route } from './router.js';
import { scanDir } from './scan.js';
import { writeManifest } from './manifest.js';
import { runRaster } from './image/run.js';
import { runVector } from './vector/run.js';
import type { ConversionManifestEntry, PipelineId } from './types.js';

const DEFAULT_IN = 'in';
const DEFAULT_OUT = 'out';

function printErr(msg: string): void {
  process.stderr.write(msg + '\n');
}

function parseArgs(): {
  subcommand: string | null;
  positional: string[];
  inDir: string;
  outDir: string;
  recursive: boolean;
  renderMode: string | null;
  ocr: string | null;
  cloud: string | null;
  fallbackRaster: boolean;
  font: string | null;
  listFonts: boolean;
  noContrast: boolean;
  contrast: number | null;
} {
  const args = process.argv.slice(2);
  let subcommand: string | null = null;
  const positional: string[] = [];
  let inDir = DEFAULT_IN;
  let outDir = DEFAULT_OUT;
  let recursive = true;
  let renderMode: string | null = null;
  let ocr: string | null = null;
  let cloud: string | null = null;
  let fallbackRaster = false;
  let font: string | null = null;
  let listFonts = false;
  let noContrast = false;
  let contrast: number | null = null;

  if (args[0] === 'convert' || args[0] === 'batch' || args[0] === 'detect' || args[0] === 'fonts') {
    subcommand = args[0];
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--in' && args[i + 1]) {
      inDir = args[++i]!;
    } else if (a === '--out' && args[i + 1]) {
      outDir = args[++i]!;
    } else if (a === '--recursive') {
      recursive = true;
    } else if (a === '--render-mode' && args[i + 1]) {
      renderMode = args[++i]!;
    } else if (a === '--ocr' && args[i + 1]) {
      ocr = args[++i]!;
    } else if (a === '--cloud' && args[i + 1]) {
      cloud = args[++i]!;
    } else if (a === '--fallback-raster') {
      fallbackRaster = true;
    } else if (a === '--font' && args[i + 1]) {
      font = args[++i]!;
    } else if (a === '--list-fonts') {
      listFonts = true;
    } else if (a === '--no-contrast') {
      noContrast = true;
    } else if (a === '--contrast' && args[i + 1]) {
      const n = Number(args[++i]!);
      if (!Number.isNaN(n)) contrast = n;
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }
  return {
    subcommand,
    positional,
    inDir,
    outDir,
    recursive,
    renderMode,
    ocr,
    cloud,
    fallbackRaster,
    font,
    listFonts,
    noContrast,
    contrast,
  };
}

const USAGE =
  'convert2 convert [--in dir] [--out dir] [--recursive] [--render-mode semantic|hybrid|faithful] [--ocr tesseract|paddleocr] [--cloud azure] [--fallback-raster] [--contrast 1|1.2|...] [--no-contrast]\n' +
  'convert2 detect <path>\n' +
  'convert2 batch [--in dir] [--out dir]\n' +
  'convert2 fonts install\n' +
  'convert2 fonts rebuild-manifest';

async function main(): Promise<number> {
  const {
    subcommand,
    positional,
    inDir,
    outDir,
    recursive,
    font,
    listFonts,
    noContrast,
    contrast,
  } = parseArgs();

  if (subcommand === 'fonts') {
    const action = positional[0] === 'fonts' ? positional[1] : positional[0];
    if (action === 'install') {
      const dir = getFontsDir();
      await mkdir(dir, { recursive: true });
      printErr(`Fonts dir: ${dir}`);
      return 0;
    }
    if (action === 'rebuild-manifest') {
      const dir = getFontsDir();
      await mkdir(dir, { recursive: true }).catch(() => {});
      const manifest = await rebuildManifest(dir);
      printErr(`Rebuilt manifest: ${manifest.fonts.length} font(s) in ${dir}`);
      return 0;
    }
    printErr(USAGE);
    return 1;
  }

  if (listFonts) {
    const { listFonts: list } = await import('./textmode/fonts.js');
    const fonts = await list();
    if (fonts.length === 0) printErr('No fonts in manifest. Run: convert2 fonts rebuild-manifest');
    else fonts.forEach((f) => printErr(`${f.name} -> ${f.file}`));
    return 0;
  }

  if (subcommand === 'detect') {
    const path = positional[0];
    if (!path) {
      printErr('Error: convert2 detect <path>');
      return 1;
    }
    try {
      const result = await detectFile(path);
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      return 0;
    } catch (err) {
      printErr(`Error: ${(err as Error).message}`);
      return 1;
    }
  }

  if (subcommand === 'batch' || subcommand === 'convert') {
    const entries = await scanDir(inDir, { recursive });
    await mkdir(outDir, { recursive: true });
    const manifestEntries: ConversionManifestEntry[] = [];
    let fontUrl: string | undefined;
    let fontFileName: string | null = null;
    if (font) {
      const { readManifest } = await import('./textmode/font-manifest.js');
      const manifest = await readManifest(getFontsDir());
      const file = manifest.fonts.find((f) => f.name === font)?.file;
      if (file) {
        fontUrl = 'fonts/' + file;
        fontFileName = file;
      }
    }
    if (fontUrl && fontFileName) {
      const outFontsDir = join(outDir, 'fonts');
      await mkdir(outFontsDir, { recursive: true });
      await copyFile(join(getFontsDir(), fontFileName), join(outFontsDir, fontFileName)).catch(() => {});
    }
    for (const e of entries) {
      const start = Date.now();
      const detection = await detectFile(e.absolutePath);
      const pipeline: PipelineId = route(detection);
      const destPath = join(outDir, e.relativePath.replace(/\.[^.]+$/, '') + '.html');
      await mkdir(dirname(destPath), { recursive: true });
      try {
        let html: string;
        if (pipeline === 'textmode') {
          const raw = await readFile(e.absolutePath);
          const result = await convertToHtml(new Uint8Array(raw), {
            filename: e.absolutePath,
            fontUrl,
            font: font ?? undefined,
            cols: detection.width,
            rows: detection.height,
          });
          html = result.html;
        } else if (pipeline === 'raster-fallback' || pipeline === 'raster-reconstruct') {
          const result = await runRaster(e.absolutePath, {
            fontUrl,
            fontFamily: font ?? undefined,
            theme: 'dark',
            contrast: noContrast ? 1 : (contrast ?? undefined),
          });
          html = result.html;
        } else if (pipeline === 'vector') {
          const result = await runVector(e.absolutePath);
          html = result.html;
        } else {
          const raw = await readFile(e.absolutePath);
          const result = await convertToHtml(new Uint8Array(raw), {
            filename: e.absolutePath,
            fontUrl,
            font: font ?? undefined,
          });
          html = result.html;
        }
        await writeFile(destPath, html, 'utf-8');
        manifestEntries.push({
          source: e.relativePath,
          dest: e.relativePath.replace(/\.[^.]+$/, '') + '.html',
          kind: detection.kind,
          pipeline,
          format: detection.format,
          confidence: detection.confidence,
          warnings: detection.warnings,
          durationMs: Date.now() - start,
        });
      } catch (err) {
        printErr(`Error ${e.relativePath}: ${(err as Error).message}`);
        manifestEntries.push({
          source: e.relativePath,
          dest: e.relativePath.replace(/\.[^.]+$/, '') + '.html',
          kind: detection.kind,
          pipeline,
          format: detection.format,
          confidence: detection.confidence,
          warnings: [...detection.warnings, (err as Error).message],
        });
      }
    }
    await writeManifest(outDir, manifestEntries);
    printErr(`Converted ${entries.length} file(s) to ${outDir}`);
    return 0;
  }

  printErr(USAGE);
  return 1;
}

main().then((code) => process.exit(code));
