---
description: Run the full code-analysis pipeline with per-stage quality-score gates and final verify-report.md validation for a feature or entry-point. Reads .analysis-profile.md; run /analysis-init first if not present.
argument-hint: <FeatureOrEntryPoint>
---

# /start-analysis

**Target**: `$ARGUMENTS`

If `$ARGUMENTS` is empty, ask the user for the feature name or entry-point before continuing.

## Orchestration

You are the pipeline orchestrator running in the main conversation context.
You **do not analyse yourself** — each layer's content is produced by its worker agent (dispatched via the Task tool). You handle: profile check, path & mode determination, run-state setup, DAG dispatch, retry (max 2), progress reporting, and a final run summary.

Apply the full orchestration logic from the **analysis-orchestration** skill and follow the steps below exactly.

### 1. Profile & startup

Read `${CLAUDE_PROJECT_DIR}/.analysis-profile.md`. Validate:
(a) non-placeholder `docs_root`,
(b) at least one filled module/layer row,
(c) at least one checked entry-point type,
(d) no absolute paths (no `C:\`, `/home/`, `C:/`, `D:\`, `/Users/` etc.) — if found, stop:
`❌ Profile contains absolute paths — please use relative paths only (relative to repo root). Run /analysis-init to regenerate.`

If any field is blank or placeholder, stop:
`❌ Profile incomplete — <field(s)> not set. Run /analysis-init to regenerate the profile card.`

Scan `<harness_dir>/*/state.json` for incomplete runs (any stage status ∉ {done, skipped}; `running` = session-interrupted, treat as pending; `blocked` = session-limit hit, treat as pending). If found, ask: resume / new / abandon.
- **resume**: re-dispatch pending/running/blocked stages in DAG order (reset to pending; do not increment retry_count).
- **new**: fresh run_id.
- **abandon**: mark non-{done,skipped} stages failed, status=partial, archive summary.md, continue with new run.

**7-day cleanup**: after handling incomplete runs, move summary.md to `_archive/<year>/`, delete state/handoff/log files, remove runs.md row for runs older than 7 days with status ∈ {done, failed, partial}.

### 1b. Workspace check (multi-service)

Check for `.workspace-profile.md` at or above the target repo. If present,
resolve `service` = the target repo's `service_id` (profile card §0) per
`analysis-orchestration` §0, use the **workspace** harness dir for run-state
(so `runs.md` is shared across services), and carry `service` through every
state.json write below. If absent, `service` is `null` and nothing else in
this command changes.

### 2. Mode detection

- **A** — reverse-analysis ("analyse X") → full pipeline.
- **B** — linked-update ("X changed") → ask for explicit change list, filter via impact matrix.
- **C** — cross-feature overview → produce `_global/<feature>-<entry>-overview/`.

### 3. Path & entry type

Determine MODULE/FEATURE/PAGE and entry-point type from the profile module/layer map. Add `batch-analysis` as first stage if batch entry type (else skipped). Ensure `deps` invokes the `batch-analysis` skill as part of its analysis.

**doc_root formula (must be followed exactly)**:
```
doc_root = <docs_root>/[<SERVICE>/]<MODULE>/<FEATURE>/<PAGE>/<tier>
```
`<SERVICE>` only appears in workspace mode (Step 1b); omitted in single-repo mode.

**Path derivation rules — match the real UI/module structure, never invent names:**

1. Locate `<MODULE>` (top-level menu/area) and `<FEATURE>` (sub-menu / screen
   title) from the project's own navigation/routing source — e.g. a layout or
   router config file (per the profile's module/layer map, or auto-detected
   UI entry-point convention). Do not assume a specific framework's file name;
   confirm from whatever this project actually uses.
2. `<PAGE>` must reflect the **actual screen's tab/sub-tab hierarchy**, joined
   with `-` for multiple levels:
   - If the source file is a sub-tab of a parent tab: `<parent-tab>-<sub-tab>`.
   - If it's a standalone feature screen: use the screen title or menu name directly.
3. `<PAGE>` must **never be omitted**; `<tier>` is only `frontend` or
   `backend`, placed after PAGE.
4. If the PAGE segment can't be determined from the feature argument, read a
   screenshot or the screen's SA.md to confirm the tab structure before naming
   it; if still unconfirmed, stop and ask the user rather than inventing a name.

Common mistakes to avoid:
- ❌ `<docs_root>/<MODULE>/<FEATURE>/<tier>` — drops the PAGE level.
- ❌ Inventing a PAGE name not backed by the actual navigation/routing source or screen.
- ✅ `<docs_root>/<MODULE>/<FEATURE>/<PAGE>/<tier>`, with PAGE derived from the real screen structure.

### 4. Run-state init

`run_id = <timestamp>-<feature>`. Create `<harness_dir>/<run_id>/state.json` (all stages pending, including vspec-* and vspec-patch; `service` from Step 1b (`null` if single-repo); `re_analysis_count=0`, `diff_rate=null`). Resolve `verify_round`: read `<doc_root>/verify-report.md` frontmatter field `verify_round`; if absent, read legacy `<doc_root>/SD-review.md` as fallback only; default 0 if neither file exists. This run's round = prior + 1. Resolve `threshold`: round 1 → 0.20, round 2 → 0.15, round ≥3 → 0.10. Write `verify_round`, `threshold`, `patch_mode="pipeline"` into state.json. Write `handoff-init-to-deps.md`. Use templates from `${CLAUDE_PLUGIN_ROOT}/templates/harness/`. Always: read whole file → modify in memory → write back whole.

**doc_root portability**: store `doc_root` in `state.json` as a **relative path** (relative to repo root) — not an absolute path. Resolve to absolute only when constructing the actual filesystem path for writing a file.

### 4b. runs.md gate

**Must complete before dispatching any worker.**

1. If `<harness_dir>/runs.md` does not exist → create it from `${CLAUDE_PLUGIN_ROOT}/templates/harness/runs.md`.
2. Append run row (run_id, service (— if single-repo), feature, entry_type, mode, started ISO, status=running, re_analysis_count=0, last_stage=—, diff_rate=—, verify_round=N, quality_min=—, failed_quality=—, docs=0/N, ended=—).
3. Immediately read back `runs.md`; verify the row with this run_id is present and status=running.
   - ✅ `[GATE] runs.md verified — starting DAG` → continue.
   - ❌ `[GATE] ⚠️ runs.md write failed: <reason> — harness tracking degraded` → continue (best-effort).

### 5. DAG dispatch (via Task)

Dispatch in dependency order, passing `run_id`, `doc_root`, entry point and the relevant handoff path to each worker:
1. `deps`
2. `vars`, `erd`, `funcs` — parallel (single batch of Task calls)
3. `flow` → `rules`
4. `ui-verify` — UI entry points only (else mark skipped)
5. `sd`
6. `api-contract` — WS/API only (else skipped) → `sa`

After each worker: read state.json stage.
- If the Task result text contains "session limit" or "resets" (platform quota hit):
  set stage `status=blocked` in state.json (**do NOT increment retry_count** — blocked ≠
  logical failure). Pause DAG and report:
  `⏸ DAG paused — subagent session limit. Stage <name> blocked. Resume with /start-analysis after reset.`
- On `status=failed` and retry_count < 2: re-dispatch.
- On second failure: stop that branch and report.
- On `status=blocked`: do not retry automatically; wait for human to resume.
Track low-confidence stages (confidence == "low") for summary.

After each document-producing worker, dispatch `quality-score` for that completed stage before any downstream stage may run. Pass `run_id`, `doc_root`, `stage`, `entry_point`, `entry_type`, and the stage doc path. Read back `quality_score`, `score_breakdown`, `score_attempts`, `quality_gate`, `repair_actions`, and `gap_report_path` from state.json:
- `quality_gate == "passed"` → continue.
- `quality_gate == "repairing"` and `score_attempts < 2` → re-dispatch the same stage using `repair_actions`, then re-run `quality-score`.
- `quality_gate in {"failed_local", "failed_structural", "pending_human"}` or `pending_human == true` → stop affected downstream stages and ask for human confirmation.

### 5.5. Auto-verify phase

Runs immediately after `sa` completes:
7. `vspec-mock` ‖ `vspec-e2e` — parallel (vspec-e2e self-skips for non-UI). Pass: run_id, doc_root, entry_point, entry_type.
8. `vspec-static` — after both done/skipped.
9. `vspec-report` — after static done; writes verify-report.md, sets diff_rate + verify_report_path in state.json.
10. `vspec-patch` — after report done; **pipeline mode** (auto-applies). Pass: run_id, doc_root. Skip if diff_rate == 0. Retry ≤2.

Same retry rule (≤2) applies to each vspec worker.

### 5.6. diff_rate post-patch assessment

Read `diff_rate` and `threshold` from state.json after vspec-patch completes.

- **diff_rate == 0** → proceed to Step 6.
- **diff_rate > 0 and `diff_rate ≤ threshold`** → proceed to Step 6. Patches applied; within acceptable range for verify_round N.
- **diff_rate > threshold** → record advisory in summary.md and runs.md row:
  `⚠️ diff_rate X.X% > threshold Y.Y% (verify_round N). Patches applied. Recommend human review of verify-report.md; consider manual re-analysis if structural issues suspected.`
  Proceed to Step 6. **Do not auto-trigger re-analysis.**

> `re_analysis_count` is retained for opt-in tracking; it is no longer incremented automatically.

### 6. Summary

Write `<harness_dir>/<run_id>/summary.md`: stage list with status/doc paths/confidence/pending-review totals, quality_score/quality_gate/score_attempts, low-confidence stages (⚠️ prefix), gap-report links, spec quality block (diff_rate ✅/⚠️, verify-report path, verify_round, threshold, patch summary: N patched / M deferred / patch_plan_path). If `diff_rate > threshold`, include the advisory note. If the sum of pending-review items across all stages is greater than 0, append one line: `N pending-review items across stages — run /gap-review <feature> to consolidate.` Always append this block verbatim:

```
⚠️ 決策執行一致性：請 grep skills/ 與 agents/ 確認
無舊做法或硬編碼殘留，避免「決策寫了但 prompt 未更新」的執行脫節。
```

Update runs.md row (status, re_analysis_count, last_stage, diff_rate, quality_min, failed_quality, docs N/total, ended ISO). Read whole → modify row in memory → write back whole.

Do **not** write session-level files outside `<harness_dir>` / `<docs_root>`.
