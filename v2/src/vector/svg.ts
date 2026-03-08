import { readFile } from 'fs/promises';
import { GENERATOR_SIGNATURE, getCreatorMetaHtml } from '../export/signature.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function svgToHtml(inputPath: string): Promise<{ html: string }> {
  const raw = await readFile(inputPath, 'utf-8');
  const body = raw.trim();
  return {
    html: `<!DOCTYPE html>
<html lang="en" data-generator="${escapeHtml(GENERATOR_SIGNATURE)}">
<head>
<meta charset="utf-8">
<meta name="generator" content="${escapeHtml(GENERATOR_SIGNATURE)}">
${getCreatorMetaHtml()}
<title>SVG</title>
<style>body{margin:0;padding:1rem;display:flex;justify-content:center;align-items:center;min-height:100vh;} svg{max-width:100%;height:auto;}</style>
</head>
<body>${body}</body>
</html>`,
  };
}
