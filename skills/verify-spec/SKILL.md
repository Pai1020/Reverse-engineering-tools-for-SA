---
name: verify-spec
description: Spec-vs-code verification. Checks an analysis SD.md against the real code via three-layer comparison (mock ↔ real code ↔ SD) plus optional dynamic UI verification, converging into verify-report.md with diff_rate. Applies targeted patches (vspec-patch) back into SD.md and sibling docs; re-analysis is optional and triggered only when diff_rate > adaptive threshold. Runs automatically as the final phase of start-analysis (after sa); also manually triggerable as a standalone verify-spec orchestrator.
---

# Verify Spec (SD ↔ code verification)

Verifies an analysed feature's `SD.md` against the actual code and produces
`verify-report.md` with a quantified `diff_rate`. Read-only with respect to existing
analysis docs — it reports differences, it does not silently edit them.

> **Invocation modes**:
> - **Automatic**: `start-analysis` runs this pipeline immediately after `sa` completes (§5.5–5.6 in the orchestrator). No separate trigger needed.
> - **Manual (standalone)**: invoke `verify-spec` directly when you want to re-verify an existing SD.md without re-running the full analysis pipeline.

> **Read the profile card** for the module/layer map and output path; auto-detect
> if absent. **Load skill `analysis-conventions`.** Requires an existing `SD.md`
> for the target function.

## Pipeline (mini-orchestrator)
```
init → [ mock ‖ e2e ] → static → report → patch → [optional: full re-analysis]
```
- **mock**: read SD.md and generate a code mock skeleton **faithful to the SD**
  (including any errors the SD describes) into the run's `mock/` dir. This makes
  the SD's claims executable/comparable. → handoff-mock-to-static.
- **e2e** (UI entry points only): dynamic UI verification via Playwright Mock
  HTML; otherwise skipped. → handoff-e2e-to-report (UI-DIFF entries).
- **static**: three-layer comparison — mock (A, = what SD says) ↔ real code (B)
  ↔ SD text (C). Each reviewed item is ✅ correct / ⚠️ omission (code has it, SD
  doesn't) / ❌ wrong (SD contradicts code). → handoff-static-to-report
  (STATIC-DIFF entries).
- **report**: converge STATIC-DIFF + UI-DIFF into `verify-report.md`; compute
  `diff_rate = (❌ wrong + ⚠️ omission) / total reviewed items`.

## diff_rate post-processing
- `diff_rate == 0` → deliver report; done.
- `diff_rate > 0` → dispatch `vspec-patch` (code is the source of truth):
  - **Standalone mode**: present `patch-plan.md` to user; apply on confirmation.
  - **Pipeline mode** (start-analysis): auto-apply; log in summary.md.
- After patch, if `diff_rate > threshold(verify_round)`:
  - **Standalone**: ask user to optionally trigger full re-analysis (default: no).
  - **Pipeline**: record advisory in summary.md; no auto re-analysis.

## Adaptive threshold (verify_round)
| verify_round | threshold |
|---|---|
| 1 | 0.20 |
| 2 | 0.15 |
| ≥3 | 0.10 |
Threshold controls the re-analysis recommendation only; patching always runs when diffs exist.

## verify-report.md structure
Use `${CLAUDE_PLUGIN_ROOT}/templates/harness/verify-report-template.md`:
§1 quality gate summary, §2 summary stats (totals, ✅/⚠️/❌ counts,
**diff_rate**, E2E diffs or N/A), §3 difference detail (❌ wrong / ⚠️ omission,
each with SD location, owner doc, patch class, real-code snippet+line,
explanation, impact), §4 confirmed-correct table, §5 UI behaviour (E2E)
differences (UI entry points only), §6 doc coverage matrix, §7 recommended
fixes, §8 overall assessment.

## Scope notes
- Static comparison does not cover: real external-system call behaviour, runtime
  data, environment-specific config.
- E2E UI verification (if run) uses Mock HTML by default — no live environment
  unless the profile §8 explicitly enables it.

## Self-check
- [ ] SD.md located for the target function.
- [ ] mock skeleton faithful to SD (errors included, not silently fixed).
- [ ] static comparison classifies every item ✅/⚠️/❌ with code evidence.
- [ ] e2e run only for UI entry points (else N/A).
- [ ] diff_rate computed by the formula; vspec-report does not edit existing docs.
- [ ] vspec-patch dispatched (or skipped if diff_rate == 0); patch-plan.md produced.
- [ ] `verify-report.md` is the primary output; legacy `SD-review.md` is read only as fallback input.
- [ ] re-analysis triggered only if diff_rate > threshold(verify_round) AND user opts in (standalone) or advisory logged (pipeline).
