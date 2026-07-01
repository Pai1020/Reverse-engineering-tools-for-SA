---
name: playwright-verify
description: Layer 3.5 (optional). Verifies the analysed UI flow with Playwright and captures screenshots to enrich SA/SD docs. Uses Mock static HTML by default (no live environment); optionally drives a live app if the profile card provides a URL + login flow. Produces UI-VERIFY.md + images/. Run after Layer 3, before Layer 4.
---

# Playwright UI Verification (Layer 3.5, optional)

Produces `UI-VERIFY.md` (+ `images/`) for a target `<FUNCTION_NAME>`.

> **Read the profile card §8 (UI verification)** for app base URL + login flow,
> or N/A. **Load skill `analysis-conventions`.** Inputs: FLOWCHART.md,
> BUSINESS-RULES.md, VARIABLE-LIST.md, and the UI template/page from
> DEPENDENCIES.md. This step only applies to **UI entry points**; skip otherwise.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/UI-VERIFY.md`
and an adjacent `images/` folder; Playwright assets under a `playwright/` subdir.

## Purpose
1. **Verify** the operation flow in FLOWCHART/BUSINESS-RULES matches the real UI.
2. **Enrich** SA docs with screenshots of key steps.
3. **Discover** UI behaviour pure code analysis can miss (ajax updates, dialogs,
   validation messages).

## Mode selection (decoupled)
- **Mock mode (default, recommended)**: build Mock static HTML from the analysed
  page structure + sample field values, drive it with Playwright locally. No live
  environment, no credentials, no test-data pollution. Use this whenever the
  profile §8 URL is N/A, or the project policy forbids touching a live env.
- **Live mode (opt-in)**: only when profile §8 provides a base URL **and** login
  flow. Read credentials **only** from the env var named in the profile — never
  hard-code secrets. If the profile says N/A, do not attempt live mode.

## Install strategy: a single Playwright install at the analysis root
Install Playwright **once** at the analysis/workspace root (a shared
`package.json` with `@playwright/test` + a root `playwright.config.ts` whose
`testMatch` is `**/playwright/verify-mock.spec.ts`, so one run from the root
discovers every feature's spec). **Do not** `npm init` / install `node_modules`
inside each feature's `playwright/` dir — that duplicates dependencies and
conflicts with the root config. Each feature only provides
`<docs_root>/.../<FUNCTION_NAME>/playwright/verify-mock.spec.ts`, writing
screenshots to its own adjacent `images/` (relative path `../images/`). Install
and execution always happen at the root.

> If the target project has no root Playwright setup yet, create the shared
> `package.json` + `playwright.config.ts` at the analysis root on first run,
> then reuse them for all features.

## Environment check → auto-install → degrade
After generating Mock HTML + `spec.ts`, before screenshots (all at the root):
1. **Check**: `node --version`; at the analysis root confirm
   `npx playwright --version`.
2. **Auto-install (if check fails, at the root)**: ensure the root
   `package.json` + `playwright.config.ts` exist; `npm install`; `npx playwright
   install chromium`; re-verify.
3. **Run** only this feature's spec from the root:
   `npx playwright test <docs_root>/.../<FUNCTION_NAME>/playwright/verify-mock.spec.ts --reporter=line`.
4. **Degrade (if install fails / Node absent)**: still emit Mock HTML + spec.ts,
   mark each scenario "⏳ pending", include the manual commands (run at the root),
   and tell the user screenshots were not generated.

## Steps
1. **Extract target flow**: read FLOWCHART user-operation section; list all
   interactive elements on the page (buttons, links, radios, checkboxes, inputs,
   selects); identify key steps (each step = one screenshot point); read
   BUSINESS-RULES validation/control rules; build an operation-script outline
   (step → expected screen state).
2. **Build Mock HTML** (Mock mode) reflecting the page structure + sample values
   from VARIABLE-LIST; or prepare navigation for Live mode.
3. **Write Playwright `spec.ts`** automating the outline, taking a screenshot at
   each step into `images/`.
4. **Run** (or degrade per above).
5. **Write UI-VERIFY.md**: per step — description, expected vs observed, embedded
   screenshot, any discrepancy with the analysed flow (feed back to Layer 3 if
   mismatched).

### Items needing human review
Append the human-review section (`analysis-conventions` §11). Flag any UI
behaviour that could not be verified (e.g. live-only flows when in Mock mode).

## Self-check
- [ ] Applies only to UI entry points (skipped + annotated otherwise).
- [ ] Mock mode used unless profile §8 explicitly enables live mode.
- [ ] No secrets in code; credentials only via the named env var.
- [ ] Each key step has a screenshot (or "⏳ pending" if degraded).
- [ ] Discrepancies vs FLOWCHART/BUSINESS-RULES reported.
