---
description: Regenerate the PM/SA progress dashboard (DASHBOARD.md) — coverage grid, open-gaps summary, diff_rate trend, and attention list — by aggregating runs.md, quality scores, the requirement-gaps rollup, and (in a workspace) SERVICE-MAP.json. Read-only; produces no analysis content of its own.
argument-hint: (no arguments)
---

# /analysis-dashboard

You are the dashboard orchestrator running in the main conversation context.
This command aggregates what other runs already produced — it does not
analyse any feature itself.

## Orchestration

### Step 1 — Check inputs exist
Confirm `<harness_dir>/runs.md` exists (if not: `❌ No runs.md found — run
/start-analysis on at least one feature first.`). Note whether
`REQUIREMENT-GAPS` rollup and (workspace mode) `SERVICE-MAP.json` exist;
if either is missing, the dashboard still generates but says so plainly in
those sections rather than showing empty/zero as if confirmed.

### Step 2 — Run the aggregation
Apply the `analysis-dashboard` skill exactly (Steps 1–6): resolve scope,
build the coverage grid, open-gaps summary, diff_rate trend, attention list,
then write `DASHBOARD.md`.

### Step 3 — Report
Print: output path, feature/service counts covered, total open gaps, and
anything in the attention list worth calling out immediately (don't just say
"see the file" if there's a `pending_human` run sitting unresolved — surface
it in the response too).
