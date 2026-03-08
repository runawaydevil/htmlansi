import sharp from 'sharp';
import type { Grid } from '../types.js';
import { createEmptyGrid, setCell } from '../textmode/grid.js';

const BLOCK_CHAR = 0x2588;
const BLOCK_UNICODE = '\u2588';
const MAX_COLS = 256;
const MAX_ROWS = 256;
const CELL_SIZE = 4;
const MIN_COLS = 40;
const MIN_ROWS = 30;
const DEFAULT_CONTRAST = 1.25;

export interface ImageToGridOptions {
  cols?: number;
  rows?: number;
  maxCols?: number;
  maxRows?: number;
  contrast?: number;
}

function applyContrast(r: number, g: number, b: number, factor: number): [number, number, number] {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(((v / 255 - 0.5) * factor + 0.5) * 255)));
  return [f(r), f(g), f(b)];
}

export async function imageToGrid(
  imageBuffer: Uint8Array,
  options: ImageToGridOptions = {}
): Promise<{ grid: Grid }> {
  const maxCols = options.maxCols ?? MAX_COLS;
  const maxRows = options.maxRows ?? MAX_ROWS;
  const pipeline = sharp(imageBuffer);
  const { data, info } = await pipeline
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;
  const baseCols = Math.max(1, Math.floor(w / CELL_SIZE));
  const baseRows = Math.max(1, Math.floor(h / CELL_SIZE));
  let cols = options.cols ?? Math.min(maxCols, Math.max(MIN_COLS, baseCols));
  let rows = options.rows ?? Math.min(maxRows, Math.max(MIN_ROWS, baseRows));
  if (cols < 1) cols = 1;
  if (rows < 1) rows = 1;
  const grid = createEmptyGrid(cols, rows, 'ans', null);
  const stride = w * channels;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const px0 = Math.floor((cx * w) / cols);
      const py0 = Math.floor((cy * h) / rows);
      const px1 = Math.min(w, Math.floor(((cx + 1) * w) / cols));
      const py1 = Math.min(h, Math.floor(((cy + 1) * h) / rows));
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let py = py0; py < py1; py++) {
        for (let px = px0; px < px1; px++) {
          const i = (py * stride + px) * channels;
          const a = channels >= 4 ? data[i + 3]! : 255;
          if (a < 128) continue;
          r += data[i]!;
          g += data[i + 1]!;
          b += data[i + 2]!;
          count++;
        }
      }
      if (count === 0) {
        r = g = b = 0;
      } else {
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
      }
      const contrast = options.contrast ?? DEFAULT_CONTRAST;
      if (contrast !== 1) {
        [r, g, b] = applyContrast(r, g, b, contrast);
      }
      const fg = (r << 16) | (g << 8) | b;
      setCell(grid, cx, cy, {
        char: BLOCK_CHAR,
        unicode: BLOCK_UNICODE,
        fg,
        bg: 0,
        blink: false,
        bright: false,
        iceColor: false,
        bold: false,
        inverse: false,
        x: cx,
        y: cy,
      });
    }
  }
  return { grid };
}
