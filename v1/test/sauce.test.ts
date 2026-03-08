import { describe, it, expect } from 'vitest';
import { readSauce, parseSauceRecord } from '../src/sauce.js';

function buildSauceRecord(overrides: Partial<Record<string, string | number>> = {}): Uint8Array {
  const buf = new Uint8Array(128);
  buf.fill(0x20);
  const setStr = (offset: number, len: number, s: string) => {
    const bytes = new TextEncoder().encode(s.slice(0, len));
    for (let i = 0; i < bytes.length && i < len; i++) buf[offset + i] = bytes[i];
  };
  setStr(0, 5, 'SAUCE');
  setStr(5, 2, '00');
  setStr(7, 35, (overrides.title as string) ?? 'Test Title');
  setStr(42, 20, (overrides.author as string) ?? 'Author');
  setStr(62, 20, (overrides.group as string) ?? '');
  setStr(82, 8, (overrides.date as string) ?? '20250101');
  buf[94] = (overrides.dataType as number) ?? 1;
  buf[95] = (overrides.fileType as number) ?? 1;
  buf[104] = (overrides.comments as number) ?? 0;
  return buf;
}

describe('sauce', () => {
  it('returns full buffer and null sauce when length < 128', () => {
    const buf = new Uint8Array([0x61, 0x62, 0x63]);
    const { content, sauce } = readSauce(buf);
    expect(sauce).toBeNull();
    expect(content.length).toBe(3);
    expect(content[0]).toBe(0x61);
  });

  it('returns full buffer and null when last 128 bytes are not SAUCE', () => {
    const buf = new Uint8Array(200);
    buf.fill(0x20);
    const { content, sauce } = readSauce(buf);
    expect(sauce).toBeNull();
    expect(content.length).toBe(200);
  });

  it('parses SAUCE and strips block from content', () => {
    const sauceBlock = buildSauceRecord({ title: 'My Art', author: 'Artist' });
    const body = new Uint8Array([0x1b, 0x5b, 0x33, 0x31, 0x6d, 0x48, 0x69]); // ESC[31mHi
    const file = new Uint8Array(body.length + 128);
    file.set(body);
    file.set(sauceBlock, body.length);
    const { content, sauce } = readSauce(file);
    expect(sauce).not.toBeNull();
    expect(sauce!.id).toBe('SAUCE');
    expect(sauce!.title).toBe('My Art');
    expect(sauce!.author).toBe('Artist');
    expect(content.length).toBe(body.length);
    expect(content[0]).toBe(0x1b);
  });

  it('strips EOF (0x1A) before SAUCE', () => {
    const sauceBlock = buildSauceRecord();
    const body = new Uint8Array([0x48, 0x69, 0x1a]); // Hi + EOF
    const file = new Uint8Array(body.length + 128);
    file.set(body);
    file.set(sauceBlock, body.length);
    const { content } = readSauce(file);
    expect(content.length).toBe(2);
    expect(content[0]).toBe(0x48);
    expect(content[1]).toBe(0x69);
  });

  it('parseSauceRecord throws if less than 128 bytes', () => {
    expect(() => parseSauceRecord(new Uint8Array(100))).toThrow();
  });
});
