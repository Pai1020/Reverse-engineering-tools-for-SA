# Changelog

All notable changes to this plugin are documented here.
This project adheres to [Semantic Versioning](https://semver.org).

## [0.7.0] - 2026-07-01

### Added
- **quality-score agent**: adds a read-only per-stage quality gate with weighted
  scoring (`score_10 >= 9.0`), same-stage repair flow, and structural gap reports.
- **Quality schema fields**: `state.json` now tracks `quality_score`,
  `score_breakdown`, `score_attempts`, `quality_gate`, `repair_actions`, and
  `gap_report_path` for document stages, plus run-level `pending_human`,
  `recommended_resume_mode`, and `affected_stages`.
- **verify-report template**: new `templates/harness/verify-report-template.md`
  includes quality gate summary, doc coverage matrix, patch class, and
  recommended fixes sections.

### Changed
- **Verify artifact rename**: primary output is now `verify-report.md` with
  `verify_report_path`; legacy `SD-review.md` is read only as fallback input.
- **Orchestration gate**: `start-analysis` now dispatches `quality-score` after
  every document-producing worker and blocks downstream stages on failed or
  structural gates.
- **Patch flow**: `vspec-patch` now reads `verify-report.md` §3/§6/§7 and treats
  structural-defer items as human-gated instead of broad automatic rewriting.
- **Metadata/version sync**: plugin and marketplace versions aligned to `0.7.0`.

## [0.6.0] - 2026-06-24

### Added
- **vspec-patch agent (P19)**: new `agents/vspec-patch.md` sub-agent that reads
  `SD-review.md §2` D-XX entries, classifies each as `patchable-localized` or
  `structural-defer`, maps to target docs (SD.md + clearly-owned sibling), and
  applies fixes inline. Code is the source of truth; every change cites a real
  code line. Produces `patch-plan.md` in the run dir.
- **Patch-first post-processing (P20)**: `start-analysis §5.6` and `verify-spec §5`
  now dispatch `vspec-patch` immediately after `vspec-report` instead of
  auto-triggering a full re-analysis. Pipeline mode auto-applies; standalone mode
  presents `patch-plan.md` and waits for confirmation.
- **Adaptive diff_rate threshold (P21)**: threshold for re-analysis recommendation
  is now `verify_round`-dependent (round 1 → 0.20, round 2 → 0.15, ≥3 → 0.10).
  `verify_round` is resolved from `SD-review.md` frontmatter and stored in
  `state.json`; passed to `vspec-report` for §1 display.
- **verify_round tracking (P22)**: `state.json` and `verify-state.json` schemas
  bumped to `1.1`, adding `verify_round`, `threshold`, `patch_mode` at run level
  and a `patch` stage entry. `runs.md` gains a `verify_round` column.
- **Advisory-only re-analysis (P23)**: `start-analysis §5.6` no longer
  auto-triggers re-analysis when `diff_rate > threshold`. Instead it records an
  advisory in `summary.md` and `runs.md`. `re_analysis_count` is retained for
  opt-in tracking only.

### Changed
- **verify-spec description**: updated to reflect patch-first pipeline with
  adaptive threshold.
- **start-analysis description**: now lists `vspec-patch` in the worker sequence.
- **SD-review-template.md**: YAML frontmatter block added (`verify_round`,
  `threshold`, `prior_diff_rate`); "Resolved threshold (round N)" row added to §1.

## [0.5.0] - 2026-06-20

### Changed
- **funcs HARD RULE — complete method signatures (P15)**: `funcs.md` Procedure step 2
  now includes a hard rule requiring workers to read every method's actual source
  declaration line; parameter types must not be inferred from call sites or summaries.
  Overloads must each be listed separately. Unlocatable signatures → confidence=low +
  pending_review. Prevents signature simplification that caused SD diff_rate spikes.
- **flow HARD RULE — complex-logic code quoting (P16)**: `flow.md` Procedure step 2
  requires verbatim source embedding (≤15 lines) for any method body with multi-step
  logic (merge, filter, iterate, branch, transform). Paraphrase distorts semantics;
  paraphrased items must be marked ⚠️ LOW confidence and added to pending_review.
- **rules HARD RULE — CR/VR source citation (P17)**: `rules.md` Procedure step 2
  requires reading and citing the actual source line for every CR/VR trigger condition;
  deriving conditions from FLOWCHART summaries alone is prohibited. Enum constants,
  list values, and multi-field boolean expressions must be embedded verbatim.
- **session limit `blocked` state (P18)**: `start-analysis.md` §5 now distinguishes
  "session limit" platform errors from logical stage failures. Affected stage gets
  `status=blocked` (no retry_count increment); DAG pauses with a clear resume message.
  §1 startup treats `blocked` same as `running` (resume-eligible, no retry_count bump).

## [0.4.0] - 2026-06-19

### Added
- **UTF-8 BOM safety check for Kiro agents (P13)**: `scripts/validate-plugin.ps1`
  now includes Check 7 that reads the first 3 bytes of every `.kiro/agents/*.json`
  and warns when a UTF-8 BOM (`EF BB BF`) is detected. kiro-cli (serde_json) does
  not tolerate BOMs and fails silently at runtime; PowerShell's own JSON parser
  does not catch this. Skipped automatically when no `.kiro/` directory is present
  under the plugin root.
- **marketplace.json version sync (P14)**: `marketplace.json` plugin entry version
  updated from `0.1.0` to `0.4.0` to stay in sync with `plugin.json`.

## [0.3.0] - 2026-06-18

### Added
- **第零規則 — runs.md write-and-verify gate (P8)**: `start-analysis` now inserts
  a §4b block that writes the run row to `runs.md`, immediately reads it back to
  verify, and prints `[GATE] runs.md verified` on success or
  `[GATE] ⚠️ runs.md write failed — harness tracking degraded` on failure without
  stopping the DAG. Auto-creates `runs.md` from template if absent.
- **session interruption recovery — status=running semantics (P9)**: §1 startup
  now explicitly maps `status=running` to "session interrupted mid-stage (treat as
  pending)". On resume, running stages are reset to `pending` before re-dispatch
  and their `retry_count` is **not** incremented (session abort ≠ logical failure).
  Abandon flow clearly defined: mark non-{done,skipped} stages as `failed`, set
  run `status=partial`, archive `summary.md` to `_archive/<year>/`.
- **runs.md new columns (P10)**: template `runs.md` table gains `re_analysis_count`
  and `last_stage` columns. `start-analysis` §6 and `verify-spec` §6 write these
  fields on run completion.
- **harness 7-day cleanup (P11)**: `start-analysis` §1 now scans for runs where
  `started_at < now − 7d` and `status ∈ {done, failed, partial}`, moves
  `summary.md` to `_archive/<year>/`, deletes `state.json` / `handoff-*.md` /
  `run-log.md`, and removes the row from `runs.md`.
- **state.json `_schema_version` (P12)**: `templates/harness/state.json` now
  includes `"_schema_version": "1.0"` at the root level, matching `verify-state.json`
  and enabling future schema compatibility checks.

## [0.2.0] - 2026-06-18

### Added
- **Profile validation gate (P1)**: `start-analysis` §1 now validates the profile
  card before proceeding — checks `docs_root`, at least one filled module/layer-map
  row, and at least one checked entry-point type. Missing or placeholder fields
  produce a clear `❌ Profile incomplete` error with a `/analysis-init` prompt.
- **HARD RULES violation criteria (P2)**: `start-analysis` §1 Scope now lists
  explicit violation examples (orchestrator executing a skill directly, writing
  analysis docs without dispatching a worker, calling Edit/Write on docs_root
  without a Task call) and a permitted-exceptions allowlist.
- **Low-confidence stage tracking (P3)**: orchestrator collects `confidence==low`
  stages during the DAG run and surfaces them in the final summary with
  `⚠️ Low confidence — human review recommended` warnings.
- **diff_rate formula documentation (P4)**: `vspec-report` procedure and
  `templates/harness/SD-review-template.md §1` now state the formula
  `diff_rate = (❌ wrong + ⚠️ omission) / total reviewed items` with a Mode B
  note (denominator = re-analysed stages only).
- **vspec Standalone mode (P5)**: `vspec-mock`, `vspec-static`, `vspec-report`,
  and `vspec-e2e` each have a Mode gate in Step 1 — if `run_id` is absent or
  `runs.md` does not exist the agent operates in Standalone mode (reads docs
  directly, writes no harness files), enabling independent reruns.
- **batch-analysis stage in state.json (P7)**: template `state.json` now includes
  an optional `batch-analysis` stage (first in the stages array; default `skipped`,
  set to `pending` for batch entry points). `start-analysis` §3 initialises it
  accordingly.
- **`analysis-profile.template.md` REQUIRED markers (P1)**: §3, §4, and §7
  headings now carry `<!-- REQUIRED -->` comments to guide profile completion.

### Changed
- **All worker agents — atomic write enforcement (P6)**: every agent that writes
  `state.json` (`vars`, `erd`, `funcs`, `flow`, `rules`, `sd`, `sa`, `api-contract`,
  `ui-verify`, `vspec-mock`, `vspec-static`, `vspec-report`, `vspec-e2e`,
  `start-analysis`, `verify-spec`) now explicitly states
  "read whole file → modify in memory → write back whole" to prevent partial
  JSON writes.
- **`scripts/validate-plugin.ps1`**: added check 6b (atomic-write pattern) that
  warns when an agent writes `state.json` without the read-modify-write instruction.

## [0.1.2] - 2026-06-16

### Added
- **start-analysis auto-verify phase (§5.5)**: after `sa` completes,
  `start-analysis` automatically dispatches `vspec-mock` ‖ `vspec-e2e` →
  `vspec-static` → `vspec-report` with the same retry (≤2) and gate rules as
  analysis stages. No separate trigger needed.
- **diff_rate gate with auto re-analysis (§5.6)**: if `diff_rate > 10%`,
  `start-analysis` parses `SD-review.md §5`, applies the analysis-orchestration
  impact matrix, and runs mode B (≤3 stages) or mode A (full pipeline) — once
  (`re_analysis_count` cap). After re-analysis, the verify phase reruns on the
  updated `SD.md`.
- **「決策執行一致性」reminder**: appended to `summary.md` whenever
  auto re-analysis was performed, prompting contributors to grep
  `skills/` and `agents/` for stale patterns.
- **state.json fields**: `re_analysis_count` (int, default 0) and `diff_rate`
  (float | null) at the run level; four new vspec stages
  (`vspec-mock`, `vspec-e2e`, `vspec-static`, `vspec-report`) in the stages
  array; `vspec-report` stage carries its own `diff_rate` field.
- **runs.md `diff_rate` column**: orchestrator writes the final `diff_rate`
  into the runs index on completion.

### Changed
- **`skills/verify-spec` description**: updated from "Manually triggered; not
  part of the start-analysis DAG" to reflect dual invocation modes (auto
  post-sa + standalone).
- **`agents/verify-spec` description**: updated to note that verify stages are
  also embedded in the `start-analysis` auto-pipeline.

## [0.1.1] - 2026-06-16

### Fixed
- **ui-verify standalone mode**: clarified that the worker runs without a
  `run_id` (no harness files) — inputs read from the docs dir, output is only
  UI-VERIFY.md — to avoid orchestration-gate stalls when invoked directly.
- **playwright-verify install strategy**: switched from per-feature
  `npm init`/`node_modules` to a single Playwright install at the analysis root
  (shared `package.json` + root `playwright.config.ts` with
  `testMatch: **/playwright/verify-mock.spec.ts`). Each feature ships only
  `verify-mock.spec.ts`; screenshots go to its adjacent `images/`. Eliminates
  duplicate node_modules and root/feature config conflicts.

## [0.1.0] - 2026-06-12

Initial release. A cross-project code analysis + spec-verification toolkit,
decoupled from any single project via a per-project profile card.

### Added
- **Manifest & marketplace**: `.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json`, MIT `LICENSE`.
- **Decoupling foundation**:
  - `analysis-conventions` skill (anti-hallucination rules, precise wording,
    diagram conventions, human-review-checklist format).
  - `analysis-init` skill (explores the project + interviews the user → writes
    `.analysis-profile.md`); defines the read-profile-else-auto-detect contract.
  - `templates/analysis-profile.template.md` (blank profile card) +
    `templates/examples/analysis-profile.example.md` (filled reference example).
- **Analysis skills (Layers 1–4)**: dependency-analysis, variable-list, erd,
  function-list, flowchart, business-rules, playwright-verify, sd, api-contract,
  batch-analysis, sa, sa-api, sa-batch.
- **Orchestration**: `analysis-orchestration` skill (document set, DAG, SA
  dispatch, run modes A/B/C with change-impact matrix) + `start-analysis`
  orchestrator agent (native subagent dispatch via the Task tool).
- **Verification**: `verify-spec` skill + 5 agents (verify-spec orchestrator,
  vspec-mock, vspec-static, vspec-e2e, vspec-report); three-layer comparison
  (mock ↔ real code ↔ SD) → `SD-review.md` with a `diff_rate`.
- **Worker agents**: deps, vars, erd, funcs, flow, rules, ui-verify, sd,
  api-contract, sa (each runs standalone or under the orchestrator).
- **Utility**: `md-to-pdf` skill + `templates/pdf-style.css` (CJK-friendly).
- **Harness templates**: run-state (`state.json`, `verify-state.json`), handoff
  templates, `runs.md` index, `SD-review-template.md`.
- **Tooling**: `scripts/validate-plugin.ps1` (manifest / frontmatter / skill
  references / no project-specific hardcoding).

### Notes
- 18 skills, 16 agents.
- The orchestration model uses native Claude subagents; prior bespoke
  keyboard-shortcut / crew features are intentionally not carried over.
