import { readSauce } from '../sauce.js';
import { decode as cp437Decode } from '../cp437.js';
import { createEmptyGrid, setCell } from '../grid.js';
import type { Grid } from '../../types.js';
import type { SauceRecord, SourceFormat } from '../../types.js';

const DEFAULT_WIDTH = 80;

export function fallbackToGrid(
  rawBytes: Uint8Array,
  options: { width?: number; sourceFormat?: SourceFormat } = {}
): { grid: Grid; sauce: SauceRecord | null } {
  const { content, sauce } = readSauce(rawBytes);
  const width = options.width ?? (sauce?.tInfo1 && sauce.tInfo1 > 0 ? sauce.tInfo1 : DEFAULT_WIDTH);
  const decoded = cp437Decode(content);
  const lines = decoded.split(/\r\n|\r|\n/);
  const height = Math.max(1, lines.length);
  const grid = createEmptyGrid(width, height, options.sourceFormat ?? 'ans', sauce);
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y]!;
    for (let x = 0; x < Math.min(line.length, width); x++) {
      const ch = line[x]!;
      const code = ch.codePointAt(0) ?? 0x20;
      setCell(grid, x, y, {
        char: code > 0xff ? 0x20 : code,
        unicode: ch,
        fg: 7,
        bg: 0,
        blink: false,
        bright: false,
        iceColor: false,
        bold: false,
        inverse: false,
        x,
        y,
      });
    }
  }
  return { grid, sauce };
}
