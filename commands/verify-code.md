---
description: Verify an existing SD.md against the real code and compute diff_rate. Standalone verification; runs vspec-mock + vspec-e2e → vspec-static → vspec-report → vspec-patch, then asks whether to re-run the full analysis pipeline if diff_rate exceeds the adaptive threshold.
argument-hint: <FeatureName>
---

# /verify-code

**Target**: `$ARGUMENTS`

If `$ARGUMENTS` is empty, ask the user for the feature name before continuing.

## Orchestration

You are the verification orchestrator running in the main conversation context.
You **do not verify yourself** — sub-agents do. You handle: input resolution, run-state init, sub-agent dispatch, gates, diff_rate post-processing, Y/N re-entry decision, and run summary.

### Step 0 — Resolve input

Get `FUNCTION_NAME` (required) and optional `service`/`doc_root`. If a
`.workspace-profile.md` exists at or above the target, resolve `service`
(ask the user which registered service if ambiguous) and search that
service's own `<docs_root>` for the function dir; else search the single
repo's `<docs_root>` as before. Confirm SD.md is readable; if not, stop:
"❌ Cannot find SD.md for <FUNCTION_NAME>." Determine module + entry_point + entry_type from SD.md / DEPENDENCIES.md.

### Step 1 — Harness init

`run_id = <timestamp>-verify-<feature>`. In workspace mode use the workspace harness dir; else the repo's own. Create `<harness_dir>/<run_id>/`. Copy `${CLAUDE_PLUGIN_ROOT}/templates/harness/verify-state.json` → state.json and fill it, including `service` (`null` if single-repo). Resolve `verify_round` and `prior_diff_rate` from `<doc_root>/verify-report.md`; if absent, read legacy `<doc_root>/SD-review.md` as fallback only. This run's round = prior + 1. Resolve `threshold`: round 1 → 0.20, round 2 → 0.15, round ≥3 → 0.10. Write `verify_round`, `threshold`, `prior_diff_rate`, `patch_mode="standalone"` into state.json. Write `handoff-init-to-mock.md` and `handoff-init-to-e2e.md` (doc_root, feature, module, entry_point). Read back to verify; on failure stop. Always: read whole file → modify in memory → write back whole.

### Step 2 — Parallel [mock, e2e]

Dispatch `vspec-mock` ‖ `vspec-e2e` (single batch of Task calls). vspec-e2e self-skips for non-UI entry points. Gate: mock done + gate_passed, e2e done or skipped, both handoffs present. Retry only the failed one ≤2.

### Step 3 — static

Dispatch `vspec-static`; gate: static done + handoff-static-to-report present. Retry ≤2.

### Step 4 — report

Dispatch `vspec-report`; confirm report done, `diff_rate` set, and `<doc_root>/verify-report.md` exists.

### Step 4.5 — patch

If `diff_rate > 0`:
1. Dispatch `vspec-patch` with `run_id`, `doc_root` (reads `patch_mode=standalone` from state.json).
2. `vspec-patch` produces `<harness_dir>/<run_id>/patch-plan.md` and presents it to the user.
3. Relay user confirmation: on `y`, vspec-patch applies patches; on `n`, patches are skipped.
4. Retry `vspec-patch` ≤2 on failure.

If `diff_rate == 0`: skip this step.

### Step 5 — optional full re-analysis

Read `diff_rate` and `threshold` from state.json.
- `diff_rate == 0` or `diff_rate ≤ threshold` → deliver report; go to Step 6.
- `diff_rate > threshold` → patches applied but diff_rate remains above this round's threshold. List the top ❌/⚠️ items (≤10) and ask:
  `"⚠️ diff_rate X.X% > threshold Y.Y% (verify_round N). Patches applied. Trigger full re-analysis for structural issues? (y/n — default n)"`

  On `y`: read `verify-report.md` §7 (recommended fixes), build a change list, apply the analysis-orchestration impact matrix (≤3 stages affected → mode B; >3 → mode A). Then **continue inline** with the full analysis pipeline. Do not stop or exit — the re-analysis is a continuation of the same conversation turn.

  On `n` (default): deliver report only; go to Step 6.

### Step 6 — Wrap up

Write `<harness_dir>/<run_id>/summary.md` (feature, module, diff_rate, verify-report path, per-stage status, post-processing decision). Set state `status=done`, `ended_at`. Update the runs.md index row (status, last_stage, diff_rate, docs, ended): read whole → modify row in memory → write back whole. Final output: run_id, verify-report path, diff_rate, post-processing decision.

## Failure handling

If any sub-agent still fails after retry: set state `status=failed`, update the runs row, print `❌ verify-code failed at <stage>: <reason>`, stop (idempotent: re-running the same run_id overwrites).
