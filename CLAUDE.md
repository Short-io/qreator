# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**qreator** — a QR Code generator library (npm: `qreator`) supporting PNG, SVG, and PDF output formats. Works in both Node.js (>=18) and browsers, with tree shaking and logo overlay support.

## Build & Test Commands

```bash
npm run prepare     # TypeScript compile (tsc) + Rollup browser bundles
npm test            # Run all tests via AVA
npx ava lib/tests/test.js           # Run Node.js tests only
npx ava lib/tests/browser.test.js   # Run browser tests only (JSDOM)
npx ava lib/tests/react.test.js     # Run React component test
```

**Important**: Tests run against compiled output in `lib/`, not source. Always run `npm run prepare` before testing.

## Architecture

### Build Pipeline

- **TypeScript** compiles `src/` → `lib/` (ESM modules, ES2020 target)
- **Rollup** bundles browser UMD builds into `lib/browser/` for PNG, SVG, PDF, and React entry points
- Both steps run via `npm run prepare`

### QR Generation Pipeline

1. **`encode.ts`** — Encodes input text into bit arrays. Supports numeric, alphanumeric, 8-bit, and URL modes. Produces data variants for different QR version ranges (`data1`, `data10`, `data27`).
2. **`qr-base.ts`** — Selects the smallest QR version that fits the data, fills the template with encoded data and error correction codes. Entry function: `QR(text, ec_level, parse_url)`.
3. **`errorcode.ts`** — Reed-Solomon error correction calculation.
4. **`matrix.ts`** — Builds the QR matrix: finders, alignment patterns, timing, data filling with masking, penalty calculation. Returns a `BitMatrix` (2D array of 0|1).
5. **`bitMatrix.ts`** — Post-processing: `zeroFillFinders()` clears finder areas (they're drawn separately as styled shapes), `clearMatrixCenter()` removes modules under logos.

### Output Renderers

- **`svg.ts`** — Generates SVG as `Uint8Array`. Used directly for SVG output and as intermediate for PNG (via sharp).
- **`png.ts`** (Node) — Renders SVG through `sharp`, composites logo overlay. Returns `Uint8ClampedArray`.
- **`png_browser.ts`** — Browser PNG via Canvas 2D API + Path2D for SVG paths.
- **`pdf.ts`** — Uses `pdf-lib`. Monkey-patches PDFPage content stream to support even-odd fill rule for finder patterns.
- **`react.tsx`** — React component wrapping `getSVG()` with `useMemo`.

### Dual Node/Browser Exports

Package exports use conditional resolution (`package.json` exports field):
- `qreator/lib/png` → `png.js` (Node, uses sharp) / `png_browser.js` (browser, uses Canvas)
- `qreator/lib/svg`, `qreator/lib/pdf`, `qreator/lib/react` — shared implementations

### SVG Path Generation

`utils.ts` contains `getDotsSVGPath()` and `getFindersSVGPath()` which convert the bit matrix into SVG path strings with optional `borderRadius`. These paths are shared across all renderers (SVG, PNG via sharp, PNG via Canvas Path2D, PDF via `drawSvgPath`).

### Testing

- **AVA** test runner with `@ava/typescript` integration (compiles via `tsc`, rewrites `src/` → `lib/`)
- **Golden file comparison**: tests generate images into `test_data/generated/` and compare against `test_data/golden/`
- PNG comparison uses `looks-same` (visual diff), SVG uses exact string match with XML-formatted diff output
- PDF tests only verify generation succeeds (no content comparison)
- Browser tests load UMD bundles into JSDOM and test the same scenarios
- Worker threads disabled in AVA config (`workerThreads: false`)
