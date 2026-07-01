---
name: md-to-pdf
description: Convert a Markdown file to PDF with CJK fonts, Mermaid diagram rendering and embedded images. User-triggered utility. Uses the bundled pdf-style.css stylesheet.
---

# Markdown → PDF

Converts a Markdown file (e.g. any analysis document) to a styled PDF.
User-triggered utility.

> Stylesheet: `${CLAUDE_PLUGIN_ROOT}/templates/pdf-style.css` (CJK-friendly).

## Prerequisites
- Node.js >= 16.
- First use: `npm install -g md-to-pdf` (>= 5.0.0).
- If the MD contains Mermaid: `npm install -g @mermaid-js/mermaid-cli` (>= 10.0.0).

## Inputs
1. Source MD path. 2. Output PDF path (optional; defaults to same dir/name
`.pdf`). 3. Whether it contains Mermaid (optional; auto-detected).

## Steps
### Step 1 — Confirm tools
```bash
npx md-to-pdf --version
npx mmdc --version 2>/dev/null || echo "MMDC_NOT_INSTALLED"
```
Install if missing (see prerequisites).

### Step 2 — Inspect the MD
Read the file; detect Mermaid code blocks (```` ```mermaid ````) and image
references (`![](...)` / `<img>`).

### Step 3 — Stylesheet
Use `${CLAUDE_PLUGIN_ROOT}/templates/pdf-style.css`. (Copy it locally first if
your converter cannot read outside the working dir.)

### Step 4 — Handle Mermaid (if any)
Preprocess with mmdc (most stable):
```bash
npx mmdc -i "<src.md>" -o "<src_processed.md>" -e svg
```
Fallback (script injection): replace ```` ```mermaid ```` blocks with
`<div class="mermaid">...</div>` and add
`--script '{"url":"https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"}'`.

### Step 5 — Convert
```bash
npx md-to-pdf "<src(.md or _processed.md)>" \
  --stylesheet "${CLAUDE_PLUGIN_ROOT}/templates/pdf-style.css" \
  --pdf-options '{"format":"A4","margin":{"top":"20mm","right":"15mm","bottom":"20mm","left":"15mm"},"printBackground":true}' \
  --launch-options '{"args":["--no-sandbox"]}'
```
Add `--dest "<output.pdf>"` to set the output path.

### Step 6 — Verify & clean up
Confirm the PDF exists and is non-zero; remove any Mermaid intermediates
(`<src_processed.md>`, `<src_processed>-*.svg`); report the output path + size.

## Common issues
| Issue | Fix |
|-------|-----|
| Garbled CJK | ensure the CSS CJK fonts are installed on the system |
| Blank Mermaid | use the mmdc preprocess; confirm `npx mmdc --version` |
| Image not found | image paths must be relative to the MD's directory |
| PDF too large | drop `printBackground`; use SVG (not PNG) for Mermaid |
| Puppeteer launch fails | add `--no-sandbox` launch option |
| Table truncated | reduce table font-size in CSS or adjust margins |

## Notes
- md-to-pdf uses Puppeteer (Chromium); first install downloads ~170MB.
- Behind a restricted network, set `PUPPETEER_SKIP_DOWNLOAD=true` and point to a
  local Chrome.
- Add `*.pdf` to `.gitignore` if outputs sit beside the docs.
