import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Terminal } = require('@xterm/headless');
import { normalizeInput } from '../normalize.js';
import type { SauceRecord } from '../../types.js';

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 2000;

export interface AnsiStreamResult {
  buffer: import('@xterm/headless').IBuffer;
  sauce: SauceRecord | null;
}

export async function ansiStreamToBuffer(
  rawBytes: Uint8Array,
  options: { cols?: number; rows?: number } = {}
): Promise<AnsiStreamResult> {
  const { content, sauce } = normalizeInput(rawBytes);
  const cols = options.cols ?? (sauce?.tInfo1 && sauce.tInfo1 > 0 ? sauce.tInfo1 : DEFAULT_COLS);
  const rows = options.rows ?? DEFAULT_ROWS;
  const term = new Terminal({ cols, rows, allowProposedApi: true });
  await new Promise<void>((resolve) => {
    term.write(content, () => resolve());
  });
  return { buffer: term.buffer.normal, sauce };
}
