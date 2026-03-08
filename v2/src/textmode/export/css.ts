export interface CssOptions {
  fontUrl?: string;
  fontFamily?: string;
  displayMode?: 'default' | 'fit';
  cols?: number;
  rows?: number;
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
  const fit = options?.displayMode === 'fit' && options?.cols != null && options?.rows != null && options.rows >= 1;
  const preFontSize = fit
    ? `min(0.98 * (100vw / ${options.cols}), 0.98 * (100vh / ${options.rows}))`
    : '14px';
  const preLineHeight = fit ? '1' : '14px';
  const ansOverflow = fit ? ' overflow: hidden;' : '';
  const preOverflow = fit ? ' overflow: hidden;' : ' overflow-x: auto;';
  return `${fontBlock}
* { box-sizing: border-box; }
.ans { background: ${bgDefault}; color: ${fgDefault}; margin: 0; padding: 0; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start;${ansOverflow} }
.ans pre { font-family: ${mainFamily}; font-size: ${preFontSize}; line-height: ${preLineHeight}; white-space: pre; letter-spacing: 0; margin: 0; padding: 0; width: 100%;${preOverflow} transform: translateZ(0); will-change: transform; }
.ans span { font-family: inherit; }
`;
}
