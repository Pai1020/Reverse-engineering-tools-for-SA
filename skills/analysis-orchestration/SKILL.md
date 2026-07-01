---
name: analysis-orchestration
description: The full code-documentation pipeline. Describes the document set, the layered DAG, SA dispatch rules, output-path determination, and the three run modes (reverse-analysis / linked-update / cross-feature overview) with the change-impact matrix. Used by the start-analysis orchestrator agent.
---

# Analysis Orchestration

End-to-end pipeline that produces up to 10 analysis documents for a feature.

> **Read the profile card first** (`${CLAUDE_PROJECT_DIR}/.analysis-profile.md`)
> for the module/layer map, entry-point types, output path (§7) and harness dir
> (§10). If absent, run `analysis-init` first (or auto-detect). **Load skill
> `analysis-conventions`.**

## §0 Workspace mode (multi-service)

Before Step 0, check whether a `.workspace-profile.md` exists at or above the
target repo (see the `workspace-discovery` skill). If it does:
- Resolve `service` = the target repo's `service_id` (its own profile card §0).
- Every output path below gains a `<SERVICE>/` segment — see "Output-path
  determination".
- Use the **workspace** harness dir (workspace card §4) instead of the
  per-repo one, so runs across all services share one `runs.md`.
- `state.json`/`runs.md` carry `service` alongside `doc_root` (see
  `templates/harness/state.json`).

If no `.workspace-profile.md` exists, `service` is `null` and every path below
is exactly as in single-repo mode — this section is otherwise a no-op. This is
orthogonal to §11 dual-pass below: §11 splits one repo's own pipeline into a
frontend/backend **tier** within that repo's doc tree; `<SERVICE>` is for
genuinely separate repos and can combine with §11 if a given service itself
uses a dual-pass protocol.

## §11 Dual-pass override (profile card §11 present)

When the profile card contains a **§11** section defining a dual-pass protocol,
execute the full 10-document pipeline **twice** instead of once:

**Pass 1 — frontend tier** (parameters from §11):
- Scope: frontend entry points (e.g. `adp-gi-ui/pages/**`) + components/mixins/store
- SA skill: `sa` (UI general)
- Output path: append `/frontend/` subdirectory to the §7 path convention
- Do NOT produce API-CONTRACT

**Pass 2 — backend tier**:
- Entry point: API endpoints discovered at Pass 1 exit boundary
- Scope: backend service (e.g. `adp-policy/`)
- SA skill: `sa-api`
- Output path: append `/backend/` subdirectory to the §7 path convention
- MUST produce API-CONTRACT

Execution order: complete Pass 1 fully before starting Pass 2.
Pass 1 endpoint list (from `this.$axios.$get/$post('...')` calls) is Pass 2's entry input.

If §11 is absent in the profile card, use the standard single-pass pipeline below.

## Document set (max 10)

| # | Document | Skill | Layer | Applies |
|---|----------|-------|-------|---------|
| ① | DEPENDENCIES.md | dependency-analysis | 1 | all |
| ② | VARIABLE-LIST.md | variable-list | 2 | all |
| ③ | ERD.md | erd | 2 | all |
| ④ | FUNCTION-LIST.md | function-list | 2 | all |
| ⑤ | FLOWCHART.md | flowchart | 3 | all |
| ⑥ | BUSINESS-RULES.md | business-rules | 3 | all |
| ⑤.5 | UI-VERIFY.md + images/ | playwright-verify | 3.5 | UI entry points |
| ⑦ | SD.md | sd | 4a | all |
| ⑧a | API-CONTRACT.md | api-contract | 4b | WS/API only |
| ⑧b | SA.md | sa / sa-api / sa-batch | 4b | all (dispatch) |

## SA dispatch rules
| Entry-point type | SA skill |
|------------------|----------|
| Web-service / REST endpoint | sa-api |
| UI page / UI-triggered batch | sa |
| Pure batch (no UI) | sa-batch |

## Output-path determination
`<docs_root>/[<SERVICE>/]<MODULE>/<FEATURE>/<PAGE>/<tier>/<TYPE>.md`

`<SERVICE>` is present only in workspace mode (§0) and comes from the
workspace registry's `service_id` — never invented, never derived from a
folder name that isn't actually registered in `.workspace-profile.md` §2.

**PATH DERIVATION — must follow actual UI structure, not invented names:**
1. `<MODULE>` = 主選單名稱（from `adp-gi-ui/layouts/default.vue`）
2. `<FEATURE>` = 子選單 / 畫面標題（from `default.vue` → `to` route → page `<h1>` or breadcrumb）
3. `<PAGE>` = 畫面 Tab 層級，用 `-` 連接多層（e.g. `核保審核-檢核不通過`）；若為獨立功能頁則直接用功能名稱；**不得自行發明、不得省略**
4. When PAGE = FUNCTION_NAME (leaf is the page itself), merge into one level; do not add extra sub-dir.

Cross-feature overviews go under `<docs_root>/_global/<feature>-<entry>-overview/`.

## Layered DAG
```
Layer 1:   deps  (Batch entry: run batch-analysis first)
              ↓
Layer 2:   vars ‖ erd ‖ funcs   (parallel; depend on ①)
              ↓
Layer 3:   flow → rules          (depend on ①②③④)
              ↓
Layer 3.5: ui-verify             (UI entry points only; depends on ⑤⑥)
              ↓
Layer 4a:  sd                    (depends on ①④⑤)
              ↓
Layer 4b:  api-contract (WS/API only) → sa   (depend on ⑦⑤⑥)
```

## Quality gate

After every document-producing stage, run `quality-score` before allowing
downstream stages to proceed. The stage passes only when `score_10 >= 9.0` and
`quality_gate == "passed"`. Local defects may enter `repairing` and rerun the
same stage once or twice; structural gaps set `pending_human=true`, write
`<stage>-gap-report.md`, and block affected downstream stages until a human
chooses the resume mode.

## Execution steps
- **Step 0 — path & entry type**: resolve `service` per §0, then determine
  MODULE/FEATURE/PAGE and entry-point type. For a batch entry point, run
  `batch-analysis` first.
- **Step 1 — scan existing docs**: check which of the 10 already exist.
- **Step 2 — completeness**: existing docs → check against the skill's self-check;
  incomplete → top up; complete → reuse as input.
- **Step 3 — produce missing docs in layer order** (per the DAG).
- **Step 3.5 — quality gate**: after each produced doc, run `quality-score` and
  stop on `failed_local`, `failed_structural`, or `pending_human`.
- **Step 4 — summary**: output a run summary including quality_score,
  quality_gate, score_attempts, and gap-report links.

## Run modes
| Mode | Trigger | Behaviour |
|------|---------|-----------|
| **A** Reverse-analysis | "analyse X" / "full run X" | produce the full set |
| **B** Linked-update | "X changed Y" / "sync X" | ask for a change list, filter affected stages via the impact matrix; mark unaffected stages skipped |
| **C** Cross-feature overview | "X module overview" | produce `_global/<feature>-<entry>-overview/` docs |

### Mode B change-impact matrix
> **Tip**: For localised SD omissions/errors found by `verify-spec`, use `vspec-patch` first — it patches docs directly without re-analysing. Reserve Mode B/A for widespread or structural changes where doc structure itself needs regenerating.

Ask the user for an explicit change list (do **not** auto-diff). Filter stages:

| Change type | ①dep | ②var | ③erd | ④fn | ⑤flow | ⑥rule | ⑦sd | ⑧a | ⑧bSA |
|-------------|:---:|:---:|:---:|:--:|:----:|:----:|:--:|:--:|:----:|
| Controller field add/remove | ● | ● | | | ● | ● | ● | | ● |
| Controller public method change | ● | | | ● | ● | ● | ● | | ● |
| Controller private helper change | | | | ○ | ○ | ○ | ○ | | ○ |
| UI field add/remove/change | | ● | | | ● | ● | ● | | ● |
| Service method change | ● | | | ● | ● | ● | ● | | ● |
| Transaction setting change | | | | ● | ● | ● | ● | | ● |
| Data-access method add/remove | ● | | ● | ● | | ● | ● | | ● |
| Query/SQL change | | ● | ● | | | ● | ● | | ● |
| Table column add/remove | | ● | ● | | | ● | ● | | ● |
| Table add/remove | ● | ● | ● | ● | ● | ● | ● | | ● |
| Constant value change | | ● | | | ○ | ● | ○ | | ● |
| Value-conversion map change | | ● | | | ● | ● | ● | | ● |
| External call add/remove | ● | | ○ | ● | ● | ● | ● | | ● |
| Branch logic change | | | | ● | ● | ● | ● | | ● |
| Validation rule change | | ● | | ● | ● | ● | ● | ● | ● |
| Request/Response field change | | ● | | | | | ● | ● | ● |
| Return-code change | | | | | | ● | | ● | ● |
| Batch: job step add/remove | ● | | | ● | ● | ○ | ● | | ● |
| Batch: tasklet logic change | | | | ● | ● | ● | ● | | ● |
| Batch: chunk reader/writer change | | ○ | ● | ● | ● | ○ | ● | | ● |
| Batch: schedule change | | | | | | | ○ | | ● |
| Batch: job-chain change | ● | | | | ● | ○ | ● | | ● |

● = must update; ○ = check then decide. ⑧a applies to WS/API only. ui-verify is
judged separately (UI entry points only).

## API-CONTRACT applicability
Produce API-CONTRACT.md only for web-service / REST entry points; order is
`⑦ SD → ⑧a API-CONTRACT → ⑧b SA`.
