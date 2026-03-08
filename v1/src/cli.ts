#!/usr/bin/env node
import { readFile, writeFile, mkdir, readdir, stat, copyFile } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { convertToHtml } from './convert.js';
import { getFontsDir } from './fonts.js';
import { rebuildManifest } from './font-manifest.js';

const ANSI_EXT = '.ans';
const DEFAULT_IN_DIR = 'in';
const DEFAULT_OUT_DIR = 'out';

function printErr(msg: string): void {
  process.stderr.write(msg + '\n');
}

function parseArgs(): {
  input: string;
  output: string | null;
  meta: string | null;
  outDir: string | null;
  theme: 'dark' | 'light';
  noMetadata: boolean;
  subcommand: string | null;
  font: string | null;
  listFonts: boolean;
  format: string | null;
  detect: boolean;
  bits: number | null;
  ice: boolean;
  bundle: boolean;
  renderMode: string | null;
  animate: boolean;
  finalFrame: boolean;
  debugDetect: boolean;
} {
  const args = process.argv.slice(2);
  let input = '';
  let output: string | null = null;
  let meta: string | null = null;
  let outDir: string | null = null;
  let theme: 'dark' | 'light' = 'dark';
  let noMetadata = false;
  let subcommand: string | null = null;
  let font: string | null = null;
  let listFonts = false;
  let format: string | null = null;
  let detect = false;
  let bits: number | null = null;
  let ice = false;
  let bundle = false;
  let renderMode: string | null = null;
  let animate = false;
  let finalFrame = false;
  let debugDetect = false;

  if (args[0] === 'fonts') {
    subcommand = 'fonts';
    input = args[1] ?? '';
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '-o' || a === '--output') {
      output = args[++i] ?? null;
    } else if (a === '--meta') {
      meta = args[++i] ?? null;
    } else if (a === '--out-dir') {
      outDir = args[++i] ?? null;
    } else if (a === '--theme') {
      const v = args[++i];
      if (v === 'light' || v === 'dark') theme = v;
    } else if (a === '--no-metadata') {
      noMetadata = true;
    } else if (a === '--font') {
      font = args[++i] ?? null;
    } else if (a === '--list-fonts') {
      listFonts = true;
    } else if (a === '--format') {
      format = args[++i] ?? null;
    } else if (a === '--detect') {
      detect = true;
    } else if (a === '--bits') {
      const v = args[++i];
      if (v !== undefined) bits = parseInt(v, 10) || null;
    } else if (a === '--ice') {
      ice = true;
    } else if (a === '--bundle') {
      bundle = true;
    } else if (a === '--render-mode') {
      renderMode = args[++i] ?? null;
    } else if (a === '--animate') {
      animate = true;
    } else if (a === '--final-frame') {
      finalFrame = true;
    } else if (a === '--debug-detect') {
      debugDetect = true;
    } else if (!a.startsWith('-') && !input && subcommand !== 'fonts') {
      input = a;
    }
  }
  if (!input && subcommand !== 'fonts') {
    input = DEFAULT_IN_DIR;
    outDir = outDir ?? DEFAULT_OUT_DIR;
  }
  return {
    input,
    output,
    meta,
    outDir,
    theme,
    noMetadata,
    subcommand,
    font,
    listFonts,
    format,
    detect,
    bits,
    ice,
    bundle,
    renderMode,
    animate,
    finalFrame,
    debugDetect,
  };
}

const USAGE =
  'Usage: htmlansi [input|dir] [-o output.html] [--meta out.json] [--out-dir dir] [--theme dark|light] [--no-metadata]\n' +
  '       [--format ans|asc|bin|xb|...] [--detect] [--list-fonts] [--font name] [--bits N] [--ice] [--bundle]\n' +
  '       [--render-mode pixelish] [--animate] [--final-frame] [--debug-detect]\n' +
  '       htmlansi fonts install | htmlansi fonts rebuild-manifest\n' +
  '  Default: converts .ans in "' +
  DEFAULT_IN_DIR +
  '" to HTML in "' +
  DEFAULT_OUT_DIR +
  '".';

async function main(): Promise<number> {
  const {
    input,
    output,
    meta,
    outDir,
    theme,
    noMetadata,
    subcommand,
    font,
    listFonts,
    format,
    detect: detectOnly,
    bits,
    ice,
    bundle,
    renderMode,
    animate,
    finalFrame,
    debugDetect,
  } = parseArgs();

  if (subcommand === 'fonts') {
    const action = input;
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
    const { listFonts: list } = await import('./fonts.js');
    const fonts = await list();
    if (fonts.length === 0) printErr('No fonts in manifest. Run: htmlansi fonts rebuild-manifest');
    else fonts.forEach((f) => printErr(`${f.name} -> ${f.file}`));
    return 0;
  }

  if (detectOnly) {
    if (!input || input === DEFAULT_IN_DIR) {
      printErr('Error: --detect requires an input file');
      return 1;
    }
    try {
      const { detect } = await import('./detect.js');
      const raw = await readFile(input);
      const result = detect(new Uint8Array(raw), input);
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      return 0;
    } catch (err) {
      printErr(`Error: ${(err as Error).message}`);
      return 1;
    }
  }

  let isDir: boolean;
  try {
    const st = await stat(input);
    isDir = st.isDirectory();
  } catch {
    printErr(`Error: cannot access '${input}'`);
    printErr(USAGE);
    return 1;
  }

  let fontUrl: string | undefined;
  let fontFileName: string | null = null;
  if (font) {
    const { getFontsDir, getFontFilePath } = await import('./fonts.js');
    const { readManifest } = await import('./font-manifest.js');
    const manifest = await readManifest(getFontsDir());
    const file = getFontFilePath(manifest, font);
    if (file) {
      fontUrl = 'fonts/' + file;
      fontFileName = file;
    }
  }

  const options = {
    theme,
    includeMetadata: !noMetadata,
    filename: input,
    format: format as import('./types.js').SourceFormat | undefined,
    font: font ?? undefined,
    fontUrl,
    bits: bits ?? undefined,
    ice,
    bundle,
    renderMode: renderMode ?? undefined,
    animate,
    finalFrame,
    debugDetect,
  };

  if (isDir) {
    const dirOut = outDir ?? DEFAULT_OUT_DIR;
    await mkdir(dirOut, { recursive: true });
    if (fontUrl && fontFileName) {
      const { getFontsDir } = await import('./fonts.js');
      const outFontsDir = join(dirOut, 'fonts');
      await mkdir(outFontsDir, { recursive: true });
      await copyFile(join(getFontsDir(), fontFileName), join(outFontsDir, fontFileName)).catch(() => {});
    }
    const entries = await readdir(input, { withFileTypes: true });
    let count = 0;
    for (const e of entries) {
      if (!e.isFile() || extname(e.name).toLowerCase() !== ANSI_EXT) continue;
      const inp = join(input, e.name);
      const out = join(dirOut, basename(e.name, extname(e.name)) + '.html');
      try {
        const raw = await readFile(inp);
        const result = await convertToHtml(new Uint8Array(raw), options);
        await writeFile(out, result.html, 'utf-8');
        count++;
      } catch (err) {
        printErr(`Error converting ${e.name}: ${(err as Error).message}`);
      }
    }
    printErr(`Converted ${count} file(s) to ${dirOut}`);
    return 0;
  }

  try {
    const raw = await readFile(input);
    const result = await convertToHtml(new Uint8Array(raw), options);
    const outPath = output ?? null;
    if (outPath) {
      await mkdir(dirname(outPath), { recursive: true }).catch(() => {});
      await writeFile(outPath, result.html, 'utf-8');
    } else {
      process.stdout.write(result.html);
    }
    if (meta && result.metadata) {
      await writeFile(meta, JSON.stringify(result.metadata, null, 2), 'utf-8');
    }
  } catch (err) {
    printErr(`Error: ${(err as Error).message}`);
    return 1;
  }
  return 0;
}

main().then((code) => process.exit(code));
