import { describe, it, expect } from 'vitest';
import { convertToHtml } from '../../src/textmode/convert.js';
import { GENERATOR_SIGNATURE } from '../../src/export/signature.js';

describe('convert', () => {
  it('produces HTML with signature', async () => {
    const raw = new Uint8Array([0x1b, 0x5b, 0x33, 0x31, 0x6d, 0x48, 0x69]);
    const { html } = await convertToHtml(raw);
    expect(html).toContain(GENERATOR_SIGNATURE);
    expect(html).toContain('data-generator="');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('produces valid structure for empty input', async () => {
    const raw = new Uint8Array([]);
    const { html } = await convertToHtml(raw);
    expect(html).toContain(GENERATOR_SIGNATURE);
    expect(html).toContain('<pre>');
  });
});
