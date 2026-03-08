import type { SauceRecord } from './types.js';
import { decode as cp437Decode } from './cp437.js';

const SAUCE_ID = 'SAUCE';
const SAUCE_RECORD_SIZE = 128;
const COMNT_ID = 'COMNT';
const COMNT_LINE_SIZE = 64;
const EOF_BYTE = 0x1a;

function readString(bytes: Uint8Array, offset: number, length: number): string {
  const slice = bytes.subarray(offset, offset + length);
  const decoded = cp437Decode(slice);
  return decoded.replace(/\0+$/, '').trimEnd();
}

function readU32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]! |
    (bytes[offset + 1]! << 8) |
    (bytes[offset + 2]! << 16) |
    (bytes[offset + 3]! << 24)
  ) >>> 0;
}

function readU16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

export function parseSauceRecord(bytes128: Uint8Array): SauceRecord {
  if (bytes128.length < SAUCE_RECORD_SIZE) {
    throw new Error('SAUCE record must be at least 128 bytes');
  }
  return {
    id: readString(bytes128, 0, 5),
    version: readString(bytes128, 5, 2),
    title: readString(bytes128, 7, 35),
    author: readString(bytes128, 42, 20),
    group: readString(bytes128, 62, 20),
    date: readString(bytes128, 82, 8),
    fileSize: readU32LE(bytes128, 90),
    dataType: bytes128[94]!,
    fileType: bytes128[95]!,
    tInfo1: readU16LE(bytes128, 96),
    tInfo2: readU16LE(bytes128, 98),
    tInfo3: readU16LE(bytes128, 100),
    tInfo4: readU16LE(bytes128, 102),
    comments: bytes128[104]!,
    tFlags: bytes128[105]!,
    tInfoS: readString(bytes128, 106, 22),
  };
}

export function readSauce(buffer: Uint8Array): { content: Uint8Array; sauce: SauceRecord | null } {
  if (buffer.length < SAUCE_RECORD_SIZE) {
    return { content: buffer.slice(), sauce: null };
  }

  const last128 = buffer.subarray(buffer.length - SAUCE_RECORD_SIZE);
  const id = readString(last128, 0, 5);
  if (id !== SAUCE_ID) {
    return { content: buffer.slice(), sauce: null };
  }

  const sauce = parseSauceRecord(last128);
  const commentBlockSize = sauce.comments > 0 ? 5 + sauce.comments * COMNT_LINE_SIZE : 0;
  const sauceBlockSize = SAUCE_RECORD_SIZE + commentBlockSize;
  let contentEnd = buffer.length - sauceBlockSize;

  if (contentEnd > 0 && buffer[contentEnd - 1] === EOF_BYTE) {
    contentEnd--;
  }
  if (contentEnd < 0) contentEnd = 0;

  const content = buffer.subarray(0, contentEnd);

  if (sauce.comments > 0 && contentEnd >= 5 + sauce.comments * COMNT_LINE_SIZE) {
    const commentStart = buffer.length - sauceBlockSize;
    if (readString(buffer.subarray(commentStart), 0, 5) === COMNT_ID) {
      const lines: string[] = [];
      for (let i = 0; i < sauce.comments; i++) {
        const lineStart = commentStart + 5 + i * COMNT_LINE_SIZE;
        lines.push(readString(buffer.subarray(lineStart), 0, COMNT_LINE_SIZE));
      }
      sauce.commentLines = lines;
    }
  }

  return { content, sauce };
}
