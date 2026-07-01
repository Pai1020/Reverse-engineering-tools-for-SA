---
description: Consolidate every produced doc's human-review items for a feature into a tracked REQUIREMENT-GAPS.md/.json backlog, and (with an explicit `apply` argument) dispatch a targeted re-analysis for answered rows. With no feature argument, rolls up gaps across every analysed feature (and every service, in a workspace).
argument-hint: [FeatureName [apply]]
---

# /gap-review

**Target**: `$ARGUMENTS`

## Orchestration

You are the gap-review orchestrator running in the main conversation context.
You dispatch the `requirement-gaps` skill; you do not invent gap content
yourself — every row must trace back to an actual `pending_review` entry or
gap-report.

### Step 1 — Parse arguments

- No arguments → **Rollup mode**: run `requirement-gaps` Rollup across every
  analysed feature (grouped by `service_id` if `.workspace-profile.md`
  exists). Report and stop — do not run Consolidate/Apply for any single
  feature in this mode.
- `<FeatureName>` only → **Consolidate mode** for that feature.
- `<FeatureName> apply` → **Consolidate, then Apply** for that feature.
  `apply` must be the literal second argument — never infer intent to apply
  from phrasing alone; if the user's request sounds like they want changes
  applied but didn't pass `apply`, ask them to re-run with it rather than
  applying implicitly.

### Step 2 — Locate the feature

Resolve `doc_root` the same way `verify-code` does (Step 0 in
`commands/verify-code.md`): search `<docs_root>` for the feature's directory
from the profile card, respecting workspace `service` scoping if applicable.
If not found, stop: `❌ Cannot find analysis docs for <FeatureName>.`

### Step 3 — Run Consolidate

Apply the `requirement-gaps` skill's Consolidate procedure. Report the
resulting counts (open / answered / resolved) and the output paths.

### Step 4 — Run Apply (only if `apply` was passed)

Apply the skill's Apply procedure. Before dispatching anything, print the
list of rows about to be acted on (id, item, answer, mapped stage(s)) so the
user can see what will be re-analysed — this is the confirmation point,
matching `verify-code`'s patch-plan-then-confirm precedent, except here the
confirmation already happened by the user typing `apply` explicitly, so
proceed directly after printing the list (no additional y/n prompt).

After the dispatched stages complete (through their normal `quality-score`
gates), re-run Consolidate once more to reconcile status, then report the
final counts.

### Step 5 — Report

- Consolidate-only: counts + path to `REQUIREMENT-GAPS.md`.
- Apply: counts before/after, which stages were re-dispatched, and the final
  resolved/still-open breakdown.
- Rollup: total open/answered/resolved across the workspace/project, grouped
  by service (if applicable), with a pointer to the rollup file.

## Failure handling

If a dispatched stage fails during Apply (per the normal DAG failure/retry
rules), leave its rows `answered` (not `resolved`) with `status_note`
explaining the stage failed — do not silently drop them from the backlog.
