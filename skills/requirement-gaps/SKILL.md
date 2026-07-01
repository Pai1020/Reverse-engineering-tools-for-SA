---
name: requirement-gaps
description: Consolidates every produced doc's "⚠️ Items needing human review" entries (+ structural quality gap-reports) for a feature into one tracked backlog (REQUIREMENT-GAPS.md/.json) with stable ids and open/answered/resolved status, and closes the loop by dispatching a targeted Mode B re-analysis once a gap is answered. Also supports a workspace/project-wide rollup. Invoked by /gap-review.
---

# requirement-gaps — consolidate, track, and close out review items

Every doc-producing skill already flags unconfirmable items in an "⚠️ Items
needing human review" section (`analysis-conventions` §11) and mirrors them
into its JSON sidecar's `pending_review` array. Today those lists are
scattered — one per doc, re-generated fresh (and un-tracked) every run. This
skill turns them into one **tracked backlog per feature**, and closes the
loop: an answered gap triggers a **targeted** re-analysis (not a full re-run)
of just the stage(s) it affects, then re-checks whether the answer actually
made it into the regenerated doc.

> **Load skill `analysis-conventions`** (this doc follows §12 output-language
> like every other produced document) and `analysis-orchestration` (the Apply
> step reuses its Mode B impact matrix — no separate re-analysis engine).

## Modes

### Consolidate (read-only aggregation, safe to run anytime)

Inputs: for the target feature's `doc_root`, every doc's JSON sidecar
`pending_review` array (`DEPENDENCIES.json`, `VARIABLE-LIST.json`, ...,
`SA.json` — whichever exist), plus any
`<harness_dir>/<run_id>/quality/<stage>-gap-report.md` structural gaps from
that feature's most recent run (read `runs.md` to find the latest `run_id`
for this feature).

1. **Load existing backlog** if `<doc_root>/REQUIREMENT-GAPS.json` already
   exists (re-running Consolidate must not lose prior status/answers).
2. **Collect** every `pending_review` entry across all sidecars + gap-report
   structural gaps for this run.
3. **Dedupe**: two entries describing the same underlying question (e.g. a
   field's meaning flagged by both VARIABLE-LIST and ERD) merge into one row;
   record every doc that raised it in `raised_in`.
4. **Assign ids**: for genuinely new items, append the next number for that
   stage (`<stage>-<n>`) — **never renumber or reuse** an existing id, even
   across re-runs, so status tracking survives re-analysis. Match new
   Consolidate output against the existing backlog by content (not position)
   to recognize "this is the same gap as `deps-03`, still open" vs "this is a
   new gap, becomes `deps-04`".
5. **Status reconciliation**: for existing `answered` rows, check whether the
   affected doc's fresh `pending_review` still contains this question — if
   not, flip to `resolved` (`resolved_at` = now); if it still does, keep
   `answered` and set `status_note` = "not yet reflected — needs another
   pass or the answer is still ambiguous". New items always start `open`.
6. **Write** `<doc_root>/REQUIREMENT-GAPS.md` (template
   `${CLAUDE_PLUGIN_ROOT}/templates/harness/requirement-gaps-template.md`)
   and `.json` (schema `templates/schemas/requirement-gaps.schema.json`).

### Apply (the closed-loop step — only when explicitly invoked with `apply`)

1. Read `REQUIREMENT-GAPS.json`; select every row with `status=open` and a
   non-empty `answer`.
2. **Map impact → stage**: each row's `impact` names a section/doc (e.g.
   "VARIABLE-LIST §6", "ERD §5") — resolve this to a DAG stage using
   `analysis-orchestration`'s document-to-skill table (①DEPENDENCIES→deps,
   ②VARIABLE-LIST→vars, ③ERD→erd, ④FUNCTION-LIST→funcs, ⑤FLOWCHART→flow,
   ⑥BUSINESS-RULES→rules, ⑤.5 UI-VERIFY→ui-verify, ⑦SD→sd, ⑧a
   API-CONTRACT→api-contract, ⑧b SA→sa). If a row's impact spans multiple
   stages, include all of them.
3. **Build a Mode B change list**: one entry per answered row, phrased as a
   confirmed fact (e.g. "field X's meaning confirmed as Y — update
   VARIABLE-LIST/ERD accordingly"), then dispatch exactly as
   `analysis-orchestration`'s Mode B ("linked-update") already does —
   run the impact matrix, re-dispatch only the affected stages (and their
   downstream dependents per the DAG), through `quality-score` as usual. This
   is not a new engine; it is Mode B, invoked programmatically instead of from
   a user-typed change list.
4. **Update status immediately**: every dispatched row → `status=answered`,
   `answered_at` = now, `dispatched_stages` = the stages just re-run.
5. **Re-run Consolidate** once the dispatched stages finish, so status
   reconciliation (Consolidate step 5) can flip genuinely-fixed rows to
   `resolved`.
6. Rows with `status=open` but **no** answer are left untouched — Apply only
   acts on rows the user has actually answered.

### Rollup (optional, workspace/project-wide)

Same dual-mode pattern as `workspace-map`:
- **Single-repo**: aggregate every analysed feature's `REQUIREMENT-GAPS.json`
  under this repo's `docs_root` into `<docs_root>/_gaps/REQUIREMENT-GAPS.md`
  (+ `.json`), one section per feature.
- **Workspace mode** (`.workspace-profile.md` present): same, but grouped by
  `service_id` first, then feature within each service, written to
  `<workspace_docs_root>/_gaps/REQUIREMENT-GAPS.md`.

The rollup JSON reuses the per-feature schema's `gaps` array shape, with each
entry additionally tagged `feature` (and `service` in workspace mode) so the
`analysis-dashboard` skill can consume it directly without re-parsing markdown.

## Self-check
- [ ] Every `pending_review` entry across every existing sidecar for this
      feature is accounted for (none silently dropped).
- [ ] Ids are stable across re-runs — no existing id renumbered or reused.
- [ ] Dedupe only merges genuinely the same question; distinct-but-related
      questions stay separate rows.
- [ ] Apply never touches a row without a user-supplied answer.
- [ ] Apply reuses the existing Mode B flow — no bespoke re-analysis logic
      duplicated here.
- [ ] Status reconciliation is evidence-based (checked against the fresh
      `pending_review`), not assumed resolved just because Apply ran.
- [ ] Output follows `analysis-conventions` §12 (Traditional Chinese primary).
