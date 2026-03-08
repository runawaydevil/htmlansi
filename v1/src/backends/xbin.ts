import { decode as cp437Decode } from '../cp437.js';
import { createEmptyGrid, setCell } from '../grid.js';
import type { Grid } from '../types.js';

const XBIN_MAGIC = new Uint8Array([0x58, 0x42, 0x49, 0x4e, 0x1a]);
const HEADER_SIZE = 11;
const PALETTE_SIZE = 48;
const FLAG_PALETTE = 1;
const FLAG_FONT = 2;
const FLAG_512FONT = 4;

export function xbinToGrid(rawBytes: Uint8Array): { grid: Grid; sauce: null } {
  if (rawBytes.length < HEADER_SIZE) {
    const g = createEmptyGrid(80, 1, 'xb', null);
    g.renderWarnings.push('xbin: file too short');
    return { grid: g, sauce: null };
  }
  for (let i = 0; i < XBIN_MAGIC.length; i++) {
    if (rawBytes[i] !== XBIN_MAGIC[i]) {
      const g = createEmptyGrid(80, 1, 'xb', null);
      g.renderWarnings.push('xbin: invalid magic');
      return { grid: g, sauce: null };
    }
  }
  const width = rawBytes[5]! | (rawBytes[6]! << 8);
  const height = rawBytes[7]! | (rawBytes[8]! << 8);
  const fontSize = Math.max(1, rawBytes[9]! || 16);
  const flags = rawBytes[10]! ?? 0;
  let offset = HEADER_SIZE;
  if (flags & FLAG_PALETTE) offset += PALETTE_SIZE;
  if (flags & FLAG_FONT) offset += (flags & FLAG_512FONT ? 512 : 256) * fontSize;
  const dataLen = width * height * 2;
  if (width < 1 || height < 1 || offset + dataLen > rawBytes.length) {
    const g = createEmptyGrid(Math.max(1, width || 80), Math.max(1, height || 1), 'xb', null);
    g.renderWarnings.push('xbin: truncated or invalid dimensions');
    return { grid: g, sauce: null };
  }
  const grid = createEmptyGrid(width, height, 'xb', null);
  const data = rawBytes.subarray(offset, offset + dataLen);
  for (let i = 0; i < width * height; i++) {
    const y = Math.floor(i / width);
    const x = i % width;
    const char = data[i * 2]!;
    const attr = data[i * 2 + 1]!;
    const fg = attr & 0x0f;
    const bg = (attr >> 4) & 0x0f;
    const bright = (attr & 0x08) !== 0;
    const unicode = cp437Decode(new Uint8Array([char]));
    setCell(grid, x, y, {
      char,
      unicode: unicode || ' ',
      fg,
      bg,
      blink: false,
      bright,
      iceColor: false,
      bold: bright,
      inverse: false,
      x,
      y,
    });
  }
  return { grid, sauce: null };
}
