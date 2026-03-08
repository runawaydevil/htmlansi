import { describe, it, expect } from 'vitest';
import { normalizePabloDraw } from '../src/pablodraw.js';

const ESC = '\x1b';

describe('pablodraw', () => {
  it('normalizes background ESC[0;R;G;Bt to ESC[48;2;R;G;Bm', () => {
    const out = normalizePabloDraw(`${ESC}[0;1;2;3t`);
    expect(out).toBe(`${ESC}[48;2;1;2;3m`);
  });

  it('normalizes foreground ESC[1;R;G;Bt to ESC[38;2;R;G;Bm', () => {
    const out = normalizePabloDraw(`${ESC}[1;255;0;0t`);
    expect(out).toBe(`${ESC}[38;2;255;0;0m`);
  });

  it('clamps RGB to 0-255', () => {
    expect(normalizePabloDraw(`${ESC}[0;300;0;0t`)).toBe(`${ESC}[48;2;255;0;0m`);
    expect(normalizePabloDraw(`${ESC}[1;0;0;0t`)).toBe(`${ESC}[38;2;0;0;0m`);
  });

  it('leaves other content unchanged', () => {
    const s = `hello${ESC}[0;10;20;30tworld${ESC}[1;0;0;255t!`;
    const out = normalizePabloDraw(s);
    expect(out).toContain('hello');
    expect(out).toContain('world');
    expect(out).toContain('!');
    expect(out).toContain(`${ESC}[48;2;10;20;30m`);
    expect(out).toContain(`${ESC}[38;2;0;0;255m`);
  });
});
