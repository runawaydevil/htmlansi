import { GENERATOR_SIGNATURE, getCreatorMetaHtml } from '../export/signature.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function vectorFallbackToHtml(options: { message?: string; link?: string }): string {
  const msg = options.message ?? 'Vector content';
  const link = options.link
    ? `<p><a href="${escapeHtml(options.link)}">Open file</a></p>`
    : '';
  return `<!DOCTYPE html>
<html lang="en" data-generator="${escapeHtml(GENERATOR_SIGNATURE)}">
<head>
<meta charset="utf-8">
<meta name="generator" content="${escapeHtml(GENERATOR_SIGNATURE)}">
${getCreatorMetaHtml()}
<title>Vector</title>
<style>body{margin:0;padding:1rem;}</style>
</head>
<body><p>${escapeHtml(msg)}</p>${link}</body>
</html>`;
}
