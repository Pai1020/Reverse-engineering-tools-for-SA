---
name: analysis-dashboard
description: Read-only PM/SA rollup. Aggregates runs.md, per-stage quality scores, the requirement-gaps rollup, and (workspace mode) SERVICE-MAP.json into one regenerable DASHBOARD.md — coverage grid, open-gaps summary, diff_rate trend, and an attention list. Invoked by /analysis-dashboard.
---

# analysis-dashboard — PM/SA progress rollup

Today, progress lives scattered across `runs.md`, per-stage `quality-score`
cards, verify-reports, and (from this phase) the requirement-gaps backlog —
nothing rolls them into one view a PM/SA can check without digging through
run directories. This skill is a **read-only aggregator**: it invents nothing,
computes nothing that isn't already recorded elsewhere, and produces one
regenerable markdown file.

> **Load skill `analysis-conventions`** (§12 output-language applies here
> too). Same dual-mode pattern as `workspace-map`/`requirement-gaps` Rollup:
> works standalone per-repo; if `.workspace-profile.md` exists, groups by
> `service_id` too.

## Inputs

- `<harness_dir>/runs.md` — every run's `service` (— if single-repo),
  `feature`, `status`, `diff_rate`, `verify_round`, `quality_min`,
  `failed_quality`, `docs N/total`.
- Per-feature quality: latest `quality_score`/`quality_gate` per stage, read
  from that feature's most recent run's `state.json` (or
  `quality/<stage>-score.md` if state.json has been archived per the 7-day
  cleanup rule).
- `<docs_root>/_gaps/REQUIREMENT-GAPS.json` (workspace/project rollup from
  `requirement-gaps` — run it first if missing, or note it's missing and
  skip that section rather than fabricating counts).
- `<workspace_docs_root>/_workspace/SERVICE-MAP.json` — workspace mode only,
  for service-level grouping and to note any isolated services.

## Procedure

### Step 1 — Resolve scope
Single-repo: one dashboard for that repo's `docs_root`. Workspace mode: one
dashboard at `<workspace_docs_root>/_dashboard/DASHBOARD.md`, sectioned by
`service_id`.

### Step 2 — Coverage grid
For every feature that has at least one run in `runs.md`: one row, one column
per the 10 doc types (①DEPENDENCIES ②VARIABLE-LIST ③ERD ④FUNCTION-LIST
⑤FLOWCHART ⑥BUSINESS-RULES ⑤.5 UI-VERIFY ⑦SD ⑧a API-CONTRACT ⑧b SA). Map each
stage's state.json entry to a cell **in this priority order** (check top to
bottom, use the first that matches):
1. `status` is `pending` or `running` (not yet completed) → `— not yet produced`.
2. `status` is `skipped` → `⏭ skipped (n/a)`.
3. `quality_gate == "passed"` → `✅ passed`.
4. `quality_gate == "repairing"` → `⚠️ repairing`.
5. `doc_path` is set but `quality_gate` is unset/null (doc written, gate not
   yet run) → `⚠️ produced, ungated` — **never** show this as `✅`.
6. Anything else with `status == "failed"`, or a `quality_gate` of
   `failed_local`/`failed_structural` → `❌ failed`.
No stage entry at all for that doc type → `— not yet produced` (same as #1).

### Step 3 — Open-gaps summary
Per feature (and per service in workspace mode): open / answered / resolved
counts and the oldest still-`open` gap's id + age, from the gaps rollup. If
the rollup file doesn't exist yet, state that plainly and suggest running
`/gap-review` first — do not report zero gaps as if that were confirmed.

### Step 4 — diff_rate trend
Per feature: one row per `verify_round` found across that feature's runs
(`runs.md` + individual `verify-report.md` frontmatter), showing
`diff_rate`, the round's `threshold`, and pass/advisory status. A feature
with only one round shows one row — this is a trend table, not a chart; no
charting library, plain markdown (existing `md-to-pdf` skill covers anyone
wanting a shareable PDF).

### Step 5 — Attention list
Pull together, across all features/services:
- Any run with `pending_human=true` (from state.json) still unresolved.
- Any stage recorded with `confidence=low`.
- Any advisory `diff_rate > threshold` note from a run summary not yet
  addressed (no newer round exists that resolved it).
Sort by feature/service; this is the "what needs a human's attention right
now" section — keep it short, don't repeat the full coverage grid here.

### Step 6 — Write
`<docs_root>/_dashboard/DASHBOARD.md` (single-repo) or
`<workspace_docs_root>/_dashboard/DASHBOARD.md` (workspace mode), using the
structure above as the section order. Include a `generated_at` timestamp so
staleness is visible at a glance — this file is meant to be regenerated on
demand, not treated as always-current without re-running.

## Self-check
- [ ] Every claim traces to `runs.md`/state.json/gaps-rollup/SERVICE-MAP —
      nothing invented or estimated.
- [ ] Coverage grid cells reflect actual `quality_gate` values, not just
      file existence.
- [ ] Missing inputs (e.g. no gaps rollup yet) are stated as missing, not
      silently treated as zero/empty.
- [ ] Workspace mode groups by service; single-repo mode omits that grouping
      entirely rather than showing an empty one.
- [ ] Output follows `analysis-conventions` §12 (Traditional Chinese primary).
