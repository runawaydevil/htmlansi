import { readFile } from 'fs/promises';
import { rasterFallbackToHtml } from './fallback.js';
import { imageToGrid } from './image-to-grid.js';
import { gridToHtml } from '../textmode/run.js';

export interface RunRasterOptions {
  renderMode?: string;
  fontUrl?: string;
  fontFamily?: string;
  theme?: 'dark' | 'light';
  cols?: number;
  rows?: number;
  maxCols?: number;
  maxRows?: number;
  contrast?: number;
}

export async function runRaster(
  inputPath: string,
  options: RunRasterOptions = {}
): Promise<{ html: string }> {
  const raw = await readFile(inputPath);
  const bytes = new Uint8Array(raw);
  try {
    const { grid } = await imageToGrid(bytes, {
      cols: options.cols,
      rows: options.rows,
      maxCols: options.maxCols,
      maxRows: options.maxRows,
      contrast: options.contrast,
    });
    const html = gridToHtml(grid, {
      theme: options.theme ?? 'dark',
      fontUrl: options.fontUrl,
      fontFamily: options.fontFamily,
      includeMetadata: false,
      displayMode: 'fit',
    });
    return { html };
  } catch {
    const ext = inputPath.replace(/^.*\./, '').toLowerCase();
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    const dataUrl = `data:${mime};base64,${(raw as Buffer).toString('base64')}`;
    const html = rasterFallbackToHtml({ base64DataUrl: dataUrl, alt: inputPath });
    return { html };
  }
}
