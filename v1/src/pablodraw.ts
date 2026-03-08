const CSI_PABLO_BG = /\x1b\[0;(\d{1,3});(\d{1,3});(\d{1,3})t/g;
const CSI_PABLO_FG = /\x1b\[1;(\d{1,3});(\d{1,3});(\d{1,3})t/g;

function clamp(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function replacePabloBg(_: string, r: string, g: string, b: string): string {
  return `\x1b[48;2;${clamp(parseInt(r, 10))};${clamp(parseInt(g, 10))};${clamp(parseInt(b, 10))}m`;
}

function replacePabloFg(_: string, r: string, g: string, b: string): string {
  return `\x1b[38;2;${clamp(parseInt(r, 10))};${clamp(parseInt(g, 10))};${clamp(parseInt(b, 10))}m`;
}

export function normalizePabloDraw(input: string): string {
  return input
    .replace(CSI_PABLO_BG, replacePabloBg)
    .replace(CSI_PABLO_FG, replacePabloFg);
}
