import { GENERATOR_SIGNATURE, getCreatorMetaHtml } from '../export/signature.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function rasterFallbackToHtml(
  options: { base64DataUrl?: string; alt?: string; width?: number; height?: number }
): string {
  const attr = options.base64DataUrl
    ? `src="${escapeHtml(options.base64DataUrl)}"`
    : '';
  const alt = options.alt ? ` alt="${escapeHtml(options.alt)}"` : '';
  const styleParts: string[] = [];
  if (options.width != null) styleParts.push(`max-width:${options.width}px`);
  if (options.height != null) styleParts.push(`max-height:${options.height}px`);
  const style = styleParts.length ? ` style="${styleParts.join(';')}"` : '';
  const body = options.base64DataUrl
    ? `<img${attr}${alt}${style}>`
    : `<p>No image data</p>`;
  return `<!DOCTYPE html>
<html lang="en" data-generator="${escapeHtml(GENERATOR_SIGNATURE)}">
<head>
<meta charset="utf-8">
<meta name="generator" content="${escapeHtml(GENERATOR_SIGNATURE)}">
${getCreatorMetaHtml()}
<title>Image</title>
<style>body{margin:0;padding:1rem;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;}img{max-width:100%;height:auto;object-fit:contain;}</style>
</head>
<body>${body}</body>
</html>`;
}
