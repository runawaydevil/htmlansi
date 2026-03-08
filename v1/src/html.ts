import type { ConvertOptions } from './types.js';
import type { SauceRecord } from './types.js';
import type { Grid, Cell } from './types.js';
import { buildPage, GENERATOR_SIGNATURE } from './export/html.js';

export { GENERATOR_SIGNATURE };

interface IBufferCell {
  getChars(): string;
  getFgColor(): number;
  getBgColor(): number;
  isFgRGB(): boolean;
  isBgRGB(): boolean;
  isBold(): boolean | number;
  isDim(): boolean | number;
  isItalic(): boolean | number;
  isUnderline(): boolean | number;
}

interface IBufferLine {
  getCell(x: number): IBufferCell | undefined;
  length: number;
}

interface IBuffer {
  getLine(y: number): IBufferLine | undefined;
  length: number;
}

const ANSI_COLORS_DARK = [
  '#000000', '#aa0000', '#00aa00', '#aa5500', '#0000aa', '#aa00aa', '#00aaaa', '#aaaaaa',
  '#555555', '#ff5555', '#55ff55', '#ffff55', '#5555ff', '#ff55ff', '#55ffff', '#ffffff',
];

const ANSI_COLORS_LIGHT = [
  '#000000', '#aa0000', '#00aa00', '#aa5500', '#0000aa', '#aa00aa', '#00aaaa', '#000000',
  '#555555', '#ff5555', '#55ff55', '#ffff55', '#5555ff', '#ff55ff', '#55ffff', '#555555',
];

function colorToCss(
  color: number,
  isRgb: boolean,
  theme: 'dark' | 'light',
  forceBlackBg: boolean
): string {
  if (isRgb) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const css = `rgb(${r},${g},${b})`;
    if (forceBlackBg && theme === 'dark' && r === 255 && g === 255 && b === 255) return '#000000';
    return css;
  }
  const palette = theme === 'dark' ? ANSI_COLORS_DARK : ANSI_COLORS_LIGHT;
  const idx = color & 0xff;
  let css = palette[idx] ?? '#fff';
  if (forceBlackBg && theme === 'dark' && (css === '#ffffff' || css === '#fff')) return '#000000';
  return css;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function bufferToHtml(
  buffer: IBuffer,
  options: ConvertOptions & { metadata?: SauceRecord | null }
): string {
  const theme = options.theme ?? 'dark';

  const lines: string[] = [];
  const lineCount = buffer.length;

  let lastUsedLine = -1;
  for (let y = 0; y < lineCount; y++) {
    const line = buffer.getLine(y);
    if (!line) continue;
    for (let x = 0; x < line.length; x++) {
      const cell = line.getCell(x);
      if (!cell) continue;
      const ch = cell.getChars();
      if (ch !== '' && ch !== ' ') {
        lastUsedLine = y;
        break;
      }
    }
  }
  const usedLineCount = lastUsedLine < 0 ? 0 : lastUsedLine + 1;

  for (let y = 0; y < usedLineCount; y++) {
    const line = buffer.getLine(y);
    if (!line) {
      lines.push('<br>');
      continue;
    }
    const row: string[] = [];
    let spanOpen = false;
    let lastFg: string | null = null;
    let lastBg: string | null = null;
    let lastBold = false;
    let lastDim = false;
    let lastItalic = false;
    let lastUnderline = false;

    const len = line.length;
    for (let x = 0; x < len; x++) {
      const cell = line.getCell(x);
      if (!cell) continue;
      const ch = cell.getChars();
      const fgNum = cell.getFgColor();
      const bgNum = cell.getBgColor();
      const isFgRgb = cell.isFgRGB?.() ?? false;
      const isBgRgb = cell.isBgRGB?.() ?? false;
      const isEmpty = ch === '' || ch === ' ';
      const fg = colorToCss(fgNum, isFgRgb, theme, false);
      const bg = colorToCss(bgNum, isBgRgb, theme, isEmpty);
      const bold = !!(cell.isBold?.());
      const dim = !!(cell.isDim?.());
      const italic = !!(cell.isItalic?.());
      const underline = !!(cell.isUnderline?.());

      const styleChanged =
        fg !== lastFg ||
        bg !== lastBg ||
        bold !== lastBold ||
        dim !== lastDim ||
        italic !== lastItalic ||
        underline !== lastUnderline;

      if (styleChanged && spanOpen) {
        row.push('</span>');
        spanOpen = false;
      }
      if (styleChanged) {
        const parts = [
          `color:${fg}`,
          `background:${bg}`,
          bold ? 'font-weight:bold' : '',
          dim ? 'opacity:0.7' : '',
          italic ? 'font-style:italic' : '',
          underline ? 'text-decoration:underline' : '',
        ].filter(Boolean);
        row.push(`<span style="${parts.join(';')}">`);
        spanOpen = true;
        lastFg = fg;
        lastBg = bg;
        lastBold = bold;
        lastDim = dim;
        lastItalic = italic;
        lastUnderline = underline;
      }
      row.push(escapeHtml(ch || ' '));
    }
    if (spanOpen) row.push('</span>');
    lines.push(row.join(''));
  }

  const body = lines.join('\n');
  return buildPage(body, {
    theme: options.theme ?? 'dark',
    includeMetadata: options.includeMetadata !== false && !!options.metadata,
    metadata: options.metadata ?? null,
    fontUrl: options.fontUrl,
    fontFamily: options.fontFamily,
  });
}

function cellColorToCss(color: number, theme: 'dark' | 'light', forceBlackBg: boolean): string {
  if (color > 0xffffff) return colorToCss(color & 0xff, false, theme, forceBlackBg);
  if (color > 15) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const css = `rgb(${r},${g},${b})`;
    if (forceBlackBg && theme === 'dark' && r === 255 && g === 255 && b === 255) return '#000000';
    return css;
  }
  return colorToCss(color, false, theme, forceBlackBg);
}

export function gridToHtml(
  grid: Grid,
  options: ConvertOptions & { metadata?: SauceRecord | null; fontUrl?: string; fontFamily?: string }
): string {
  const theme = options.theme ?? 'dark';
  const lines: string[] = [];
  let lastUsedLine = -1;
  for (let y = 0; y < grid.height; y++) {
    const row = grid.cells[y];
    if (!row) continue;
    for (let x = 0; x < grid.width; x++) {
      const cell = row[x];
      if (!cell) continue;
      const ch = (cell.unicode ?? String.fromCodePoint(cell.char)) || ' ';
      if (ch !== '' && ch !== ' ') {
        lastUsedLine = y;
        break;
      }
    }
  }
  const usedLineCount = lastUsedLine < 0 ? 0 : lastUsedLine + 1;
  for (let y = 0; y < usedLineCount; y++) {
    const row = grid.cells[y];
    if (!row) {
      lines.push('<br>');
      continue;
    }
    const rowHtml: string[] = [];
    let spanOpen = false;
    let lastFg: string | null = null;
    let lastBg: string | null = null;
    let lastBold = false;
    for (let x = 0; x < grid.width; x++) {
      const cell: Cell | undefined = row[x];
      if (!cell) continue;
      const ch = (cell.unicode ?? String.fromCodePoint(cell.char)) || ' ';
      const isEmpty = ch === '' || ch === ' ';
      const fg = cellColorToCss(cell.fg, theme, false);
      const bg = cellColorToCss(cell.bg, theme, isEmpty);
      const bold = !!(cell.bold || cell.bright);
      const styleChanged = fg !== lastFg || bg !== lastBg || bold !== lastBold;
      if (styleChanged && spanOpen) {
        rowHtml.push('</span>');
        spanOpen = false;
      }
      if (styleChanged) {
        const parts = [
          `color:${fg}`,
          `background:${bg}`,
          bold ? 'font-weight:bold' : '',
        ].filter(Boolean);
        rowHtml.push(`<span style="${parts.join(';')}">`);
        spanOpen = true;
        lastFg = fg;
        lastBg = bg;
        lastBold = bold;
      }
      rowHtml.push(escapeHtml(ch || ' '));
    }
    if (spanOpen) rowHtml.push('</span>');
    lines.push(rowHtml.join(''));
  }
  const body = lines.join('\n');
  return buildPage(body, {
    theme,
    includeMetadata: options.includeMetadata !== false && !!options.metadata,
    metadata: options.metadata ?? grid.metadata ?? null,
    fontUrl: options.fontUrl,
    fontFamily: options.fontFamily,
  });
}
