# htmlansi

Converts textmode art and, in v2, raster and vector files to HTML. Two versions live in the repo: v1 (textmode only) and v2 (multimodal).

Requires Node.js >= 20.

## v1 and v2

| | v1 | v2 |
|---|----|-----|
| Scope | Textmode only (.ans, .asc, .bin, .xb, etc.) | Textmode, raster (.png, .jpg, …), vector (.svg) |
| CLI | `htmlansi` (bin), `npm run convert` | `convert2` (bin), `npm run convert2` |
| Input/Output | Single file or dir; output as configured | Recursive `in/` to `out/`, structure preserved |
| Pipeline | ANSI/BIN/XBIN/ADF/IDF/TND to HTML | Detect, route by type, then textmode or image or vector pipeline |

Use v1 when you only need textmode conversion. Use v2 for batch conversion, raster (PNG to block art or fallback), and vector.

## v1 — textmode only

```bash
cd v1
npm install
npm run build
npm run convert
```

Or run the CLI with options (see v1 usage). Input and output are configured via CLI args or script.

## v2 — multimodal

```bash
cd v2
npm install
npm run build
npm run convert2
```

Put files in `v2/in/`. Output goes to `v2/out/`; `v2/out/manifest.json` lists each conversion. To use custom dirs:

```bash
node dist/cli.js convert --in in --out out
```

Commands: `convert2 convert`, `convert2 detect <path>`, `convert2 batch --in ./in --out ./out`, `convert2 fonts install`, `convert2 fonts rebuild-manifest`.

Input types in v2: textmode (.ans, .asc, .txt, .nfo, .diz, .pcb, .bin, .xb, .adf, .idf, .tnd), raster (.png, .jpg, .jpeg, .webp, .gif, .bmp, .tiff, .avif), vector (.svg).

https://runv.sh
