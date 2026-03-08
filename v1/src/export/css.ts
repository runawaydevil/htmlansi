export interface CssOptions {
  fontUrl?: string;
  fontFamily?: string;
}

export function getCss(theme: 'dark' | 'light', options?: CssOptions): string {
  const bgDefault = theme === 'dark' ? '#000000' : '#f5f5f5';
  const fgDefault = theme === 'dark' ? '#fefefe' : '#000000';
  const family = options?.fontFamily ?? 'ans-font';
  let fontBlock = '';
  if (options?.fontUrl) {
    const woff2 = options.fontUrl.toLowerCase().endsWith('.woff2');
    const src = woff2
      ? `url("${options.fontUrl}") format("woff2"),url("${options.fontUrl.replace(/\.woff2$/i, '.woff')}") format("woff")`
      : `url("${options.fontUrl}") format("woff")`;
    fontBlock = `@font-face{font-family:"${family}";src:${src};font-display:swap;}
`;
  }
  const mainFamily = options?.fontUrl
    ? `"${family}","Consolas","Monaco","Courier New",monospace`
    : '"Consolas","Monaco","Courier New",monospace';
  return `${fontBlock}
* { box-sizing: border-box; }
.ans { background: ${bgDefault}; color: ${fgDefault}; margin: 0; padding: 0; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; }
.ans pre { font-family: ${mainFamily}; font-size: 14px; line-height: 14px; white-space: pre; letter-spacing: 0; margin: 0; padding: 0; width: 100%; overflow-x: auto; transform: translateZ(0); will-change: transform; }
.ans span { font-family: inherit; }
`;
}
