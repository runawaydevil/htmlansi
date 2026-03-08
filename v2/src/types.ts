export type InputKind =
  | 'textmode'
  | 'raster-text-heavy'
  | 'raster-mixed'
  | 'raster-photo'
  | 'vector'
  | 'unknown';

export interface StyleHints {
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
}

export interface FileDetectionResult {
  inputPath: string;
  ext?: string;
  mime?: string;
  kind: InputKind;
  format: string;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  width?: number;
  height?: number;
  textCoverage?: number;
  styleHints?: StyleHints;
  warnings: string[];
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

export type RenderMode = 'semantic' | 'hybrid' | 'faithful';

export type DisplayMode = 'default' | 'fit';

export interface ConvertOptions {
  theme?: 'dark' | 'light';
  includeMetadata?: boolean;
  cols?: number;
  rows?: number;
  displayMode?: DisplayMode;
  filename?: string;
  format?: SourceFormat;
  font?: string;
  fontUrl?: string;
  fontFamily?: string;
  bits?: number;
  ice?: boolean;
  bundle?: boolean;
  renderMode?: RenderMode;
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

export interface ConversionManifestEntry {
  source: string;
  dest: string;
  kind: InputKind;
  pipeline: string;
  ocrEngine?: string;
  format: string;
  confidence: string;
  font?: string;
  warnings: string[];
  assets?: string[];
  durationMs?: number;
}

export type PipelineId =
  | 'textmode'
  | 'raster-reconstruct'
  | 'raster-fallback'
  | 'vector'
  | 'unknown';
