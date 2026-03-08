export interface SauceRecord {
  id: string;
  version: string;
  title: string;
  author: string;
  group: string;
  date: string;
  fileSize: number;
  dataType: number;
  fileType: number;
  tInfo1: number;
  tInfo2: number;
  tInfo3: number;
  tInfo4: number;
  comments: number;
  tFlags: number;
  tInfoS: string;
  commentLines?: string[];
}

export type SourceFormat =
  | 'ans'
  | 'asc'
  | 'txt'
  | 'nfo'
  | 'diz'
  | 'pcb'
  | 'bin'
  | 'xb'
  | 'adf'
  | 'idf'
  | 'tnd'
  | 'unknown';

export type DetectionConfidence = 'high' | 'medium' | 'low';

export interface DetectionHints {
  codepage?: number;
  width?: number;
  height?: number;
  font?: string;
  iceColors?: boolean;
  bits?: number;
  animated?: boolean;
}

export interface DetectionResult {
  format: SourceFormat;
  confidence: DetectionConfidence;
  reasons: string[];
  sauce?: SauceRecord | null;
  hints: DetectionHints;
}

export interface Cell {
  char: number;
  unicode: string;
  fg: number;
  bg: number;
  blink: boolean;
  bright: boolean;
  iceColor: boolean;
  bold: boolean;
  inverse: boolean;
  x: number;
  y: number;
  fontHint?: string;
  codepage?: number;
}

export interface Grid {
  width: number;
  height: number;
  cells: Cell[][];
  metadata: SauceRecord | null;
  sourceFormat: SourceFormat;
  renderWarnings: string[];
}

export interface ConvertOptions {
  theme?: 'dark' | 'light';
  includeMetadata?: boolean;
  cols?: number;
  rows?: number;
  filename?: string;
  format?: SourceFormat;
  font?: string;
  fontUrl?: string;
  fontFamily?: string;
  bits?: number;
  ice?: boolean;
  bundle?: boolean;
  renderMode?: string;
  animate?: boolean;
  finalFrame?: boolean;
  debugDetect?: boolean;
}

export interface ConvertResult {
  html: string;
  metadata: SauceRecord | null;
}

export interface ReadSauceResult {
  content: Uint8Array;
  sauce: SauceRecord | null;
}
