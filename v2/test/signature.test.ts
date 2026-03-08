import { describe, it, expect } from 'vitest';
import {
  GENERATOR_SIGNATURE,
  CREATOR_NAME,
  CREATOR_SITE,
  CREATOR_EMAIL,
} from '../src/export/signature.js';
import { convertToHtml } from '../src/textmode/convert.js';
import { rasterFallbackToHtml } from '../src/image/fallback.js';
import { vectorFallbackToHtml } from '../src/vector/fallback.js';

const SIGNATURE = 'made by runv.sh github: runawaydebil';

describe('signature', () => {
  it('constant equals exact string', () => {
    expect(GENERATOR_SIGNATURE).toBe(SIGNATURE);
  });

  it('textmode HTML contains meta generator and data-generator', async () => {
    const raw = new Uint8Array([0x1b, 0x5b, 0x33, 0x31, 0x6d, 0x48, 0x69]);
    const { html } = await convertToHtml(raw);
    expect(html).toContain(SIGNATURE);
    expect(html).toContain('name="generator"');
    expect(html).toContain('data-generator="');
    expect(html).toContain(`content="${SIGNATURE}"`);
  });

  it('raster fallback HTML contains signature', () => {
    const html = rasterFallbackToHtml({ alt: 'x' });
    expect(html).toContain(SIGNATURE);
    expect(html).toContain('data-generator="');
  });

  it('vector fallback HTML contains signature', () => {
    const html = vectorFallbackToHtml({ message: 'x' });
    expect(html).toContain(SIGNATURE);
    expect(html).toContain('data-generator="');
  });

  it('HTML contains system creator meta (runv, runv.sh, email)', () => {
    const html = rasterFallbackToHtml({ alt: 'x' });
    expect(html).toContain(`name="author" content="${CREATOR_NAME}"`);
    expect(html).toContain(CREATOR_SITE);
    expect(html).toContain(CREATOR_EMAIL);
  });
});
