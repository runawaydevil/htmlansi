import { readSauce } from '../sauce.js';
import { decode as cp437Decode } from '../cp437.js';
import { createEmptyGrid, setCell } from '../grid.js';
import type { Grid } from '../../types.js';
import type { SauceRecord } from '../../types.js';

const DEFAULT_WIDTH = 80;

export function binToGrid(
  rawBytes: Uint8Array,
  options: { width?: number; height?: number } = {}
): { grid: Grid; sauce: SauceRecord | null } {
  const { content, sauce } = readSauce(rawBytes);
  let width = options.width ?? (sauce?.tInfo1 && sauce.tInfo1 > 0 ? sauce.tInfo1 : DEFAULT_WIDTH);
  let height = options.height ?? (sauce?.tInfo2 && sauce.tInfo2 > 0 ? sauce.tInfo2 : 0);
  if (height <= 0) height = Math.max(1, Math.floor(content.length / 2 / width));
  const grid = createEmptyGrid(width, height, 'bin', sauce);
  const pairs = Math.floor(content.length / 2);
  for (let i = 0; i < pairs; i++) {
    const y = Math.floor(i / width);
    const x = i % width;
    if (y >= height) break;
    const char = content[i * 2]!;
    const attr = content[i * 2 + 1]!;
    const fg = attr & 0x0f;
    const bg = (attr >> 4) & 0x0f;
    const bright = (attr & 0x08) !== 0;
    const blink = (attr & 0x20) !== 0;
    const unicode = cp437Decode(new Uint8Array([char]));
    setCell(grid, x, y, {
      char,
      unicode: unicode || ' ',
      fg,
      bg,
      blink,
      bright,
      iceColor: false,
      bold: bright,
      inverse: false,
      x,
      y,
    });
  }
  return { grid, sauce };
}
