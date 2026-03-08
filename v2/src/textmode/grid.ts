import type { Grid, Cell, SourceFormat } from '../types.js';
import type { SauceRecord } from '../types.js';

export function createEmptyGrid(
  width: number,
  height: number,
  sourceFormat: SourceFormat = 'ans',
  metadata: SauceRecord | null = null
): Grid {
  const cells: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        char: 0x20,
        unicode: ' ',
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
    cells.push(row);
  }
  return {
    width,
    height,
    cells,
    metadata,
    sourceFormat,
    renderWarnings: [],
  };
}

export function setCell(grid: Grid, x: number, y: number, cell: Partial<Cell>): void {
  if (y < 0 || y >= grid.height || x < 0 || x >= grid.width) return;
  const row = grid.cells[y]!;
  const existing = row[x]!;
  row[x] = {
    ...existing,
    ...cell,
    x,
    y,
  };
}

export function getCell(grid: Grid, x: number, y: number): Cell | undefined {
  if (y < 0 || y >= grid.height || x < 0 || x >= grid.width) return undefined;
  return grid.cells[y]?.[x];
}

export function getDimensions(grid: Grid): { width: number; height: number } {
  return { width: grid.width, height: grid.height };
}

export function addRenderWarning(grid: Grid, message: string): void {
  grid.renderWarnings.push(message);
}
