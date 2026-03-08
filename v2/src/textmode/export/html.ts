import { getCss } from './css.js';
import { GENERATOR_SIGNATURE, getCreatorMetaHtml } from '../../export/signature.js';
import type { SauceRecord } from '../../types.js';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function metadataBlock(meta: SauceRecord): string {
  const lines = [
    `Title: ${meta.title}`,
    `Author: ${meta.author}`,
    `Group: ${meta.group}`,
    `Date: ${meta.date}`,
    `DataType: ${meta.dataType} FileType: ${meta.fileType}`,
    `TInfo1: ${meta.tInfo1} TInfo2: ${meta.tInfo2}`,
  ];
  if (meta.commentLines?.length) {
    lines.push('Comments:', ...meta.commentLines);
  }
  return lines.join('\n');
}

export interface BuildPageOptions {
  theme?: 'dark' | 'light';
  includeMetadata?: boolean;
  metadata?: SauceRecord | null;
  fontUrl?: string;
  fontFamily?: string;
  displayMode?: 'default' | 'fit';
  cols?: number;
  rows?: number;
}

export function buildPage(preBody: string, options: BuildPageOptions = {}): string {
  const theme = options.theme ?? 'dark';
  const includeMetadata = options.includeMetadata !== false && options.metadata;
  const css = getCss(theme, {
    fontUrl: options.fontUrl,
    fontFamily: options.fontFamily,
    displayMode: options.displayMode,
    cols: options.cols,
    rows: options.rows,
  });
  const metaHtml =
    includeMetadata && options.metadata
      ? `\n<!-- SAUCE\n${escapeHtml(metadataBlock(options.metadata))}\n-->\n`
      : '';
  return `<!DOCTYPE html>
<html lang="en" data-generator="${escapeHtml(GENERATOR_SIGNATURE)}">
<head>
<meta charset="utf-8">
<meta name="generator" content="${escapeHtml(GENERATOR_SIGNATURE)}">
${getCreatorMetaHtml()}
<title>ANSI Art</title>
<style>${css}</style>
</head>
<body class="ans">${metaHtml}<pre>${preBody}</pre></body>
</html>`;
}
