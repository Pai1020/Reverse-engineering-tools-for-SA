# Reverse-engineering-tools-for-SA

An agent tool that helps a project manager / system analyst (SA) organize the
current status of a project during reverse engineering. It is a **cross-project
reverse-engineering toolkit** for Claude Code, packaged as a plugin: it produces
layered analysis documents and verifies them against the real code — for
**any** codebase, whether it's a single-repo monolith, a separated
frontend+backend, or several microservices checked out side by side under one
parent folder.

Built on top of (and extending) the `code-analysis-package` methodology, with
two additions for this project's needs: **multi-service workspace support**
(cross-repo dependency tracking) and a **deterministic static-analysis facts
layer** (tree-sitter based) that reduces reliance on pure LLM reading for
symbol/endpoint/table facts.

## How decoupling works

- The plugin ships **only the methodology** ("how to analyse").
- A **profile card** in each repo (`.analysis-profile.md`) supplies the
  **facts** (module/layer paths, tech stack, schema prefix, constant classes,
  output path, entry-point types).
- For multi-repo targets, a **workspace profile** (`.workspace-profile.md`) at
  the parent folder registers each repo as a **service** (id, kind, base URL)
  so cross-service calls can be told apart from genuine external systems.
- If no profile card exists, skills fall back to live auto-detection
  (reading `pom.xml` / `package.json` / scanning directories).

## Install

```bash
claude plugin marketplace add <this-repo-path-or-url>
claude plugin install sa-reverse-engineering-toolkit@sa-reverse-engineering-toolkit
claude plugin list      # confirm it installed
```

## First-time use

**Single repo:**
```
/analysis-init
```

**Multi-repo workspace** (separated frontend/backend, or several
microservices under one parent folder):
```
/workspace-init
```
This discovers sibling repos, writes `.workspace-profile.md`, then runs
`/analysis-init` for every repo still missing its own profile card.

## Run analysis / verification

```
# Full pipeline (orchestrator dispatches each worker in dependency order)
/start-analysis analyse <FeatureOrEntryPoint>

# A single layer on its own
/dependency-analysis
/erd
/flowchart

# Spec-vs-code verification (produces verify-report.md with a diff_rate)
/verify-code verify <FeatureName>

# Workspace-only: cross-service dependency graph across every registered service
/workspace-map

# Convert any analysis doc to a styled PDF
/md-to-pdf
```

## What it produces

Layered analysis docs per analysed feature (output path comes from the
profile card §7; default
`.analysis/docs/[<SERVICE>/]<MODULE>/<FEATURE>/<PAGE>/<FUNCTION>/` — the
`<SERVICE>` segment only appears in workspace mode):

| Layer | Document | Skill | Applies |
|-------|----------|-------|---------|
| 1 | `DEPENDENCIES.md` (+ `.json` sidecar) | dependency-analysis | all |
| 2 | `VARIABLE-LIST.md` | variable-list | all |
| 2 | `ERD.md` | erd | all |
| 2 | `FUNCTION-LIST.md` (+ `.json` sidecar) | function-list | all |
| 3 | `FLOWCHART.md` | flowchart | all |
| 3 | `BUSINESS-RULES.md` | business-rules | all |
| 3.5 | `UI-VERIFY.md` + images | playwright-verify | UI only |
| 4a | `SD.md` | sd | all |
| 4b | `API-CONTRACT.md` | api-contract | WS/API only |
| 4b | `SA.md` | sa / sa-api / sa-batch | all (dispatch) |
| verify | `verify-report.md` | verify-spec | auto (post-sa) + on demand |
| workspace | `SERVICE-MAP.md` + `.json` | workspace-map | multi-repo only |

## Multi-service workspaces

When a `.workspace-profile.md` exists at the parent folder (see
`workspace-discovery` / `/workspace-init`):
- Every output path, harness run, and `runs.md` row gains a `service`
  dimension, so one shared harness tracks runs across all services.
- `dependency-analysis` classifies each outbound call the analysed feature
  makes: a match against another registered service's `base_url`/aliases is
  tagged `[cross-service → <service_id>]` (recorded in a "Cross-service
  calls" table) instead of being filed as a generic external system. It does
  **not** auto-recurse into the callee repo — that's a separate, explicit run.
- `/workspace-map` aggregates every service's cross-service findings into one
  graph: `SERVICE-MAP.md` (mermaid + table) and `SERVICE-MAP.json` (nodes =
  services, edges = calls with protocol/path/confidence).

Single-repo usage is completely unaffected — all of this is additive and
only activates when `.workspace-profile.md` is present.

## Static-analysis facts layer

`scripts/extract/` is a deterministic, tree-sitter/XML-based pre-pass that
parses source once per repo and writes `.analysis/index/<service>/facts.json`
— plain data (symbols, REST endpoints, outbound HTTP calls, DB access), no
interpretation. Skills consult this as ground truth for existence claims
before free-reading source (see the `static-index` skill), which cuts down on
hallucinated signatures/endpoints/tables. It's additive: skills work exactly
as before if `facts.json` doesn't exist.

**Coverage this pass**: Java (Spring Boot REST endpoints + DI edges, MyBatis
mapper XML, and JPA — `@Entity`/`@Table`, repository interfaces, `@Query`
JPQL/native, and derived-query methods), Angular (`HttpClient` calls), Vue SFC
(`axios`/`$axios` calls). Other stacks fall back to LLM-only reading, exactly
as before this layer existed.

```bash
cd scripts/extract && npm install        # one-time, needs network
node index.js <repo_path> --service <id> # writes facts.json, caches by content hash
```

## Pipeline (DAG)

`start-analysis` runs the full pipeline end-to-end. Each document-producing
stage is gated by `quality-score` (`score_10 >= 9.0`) before downstream stages
run, followed by an automatic verify phase after `sa`:

```
deps → (vars ‖ erd ‖ funcs) → flow → rules → [ui-verify: UI only]
     → sd → [api-contract: WS/API only] → sa
     → (vspec-mock ‖ vspec-e2e) → vspec-static → vspec-report   ← auto verify
```

`verify-code` can also be triggered standalone to re-verify an existing
`SD.md` without re-running the full analysis pipeline:

```
verify-code (standalone): init → (mock ‖ e2e) → static → report → patch → diff_rate
```

**Quality and verify signals are separate**:
- `quality_score` measures analysis-document completeness and evidence quality;
  `quality_gate=passed` is required before downstream stages run.
- `diff_rate` measures SD-vs-code consistency in `verify-report.md`.
- `vspec-patch` patches localized D-XX differences first. If `diff_rate` exceeds
  the adaptive threshold (round 1=0.20, round 2=0.15, round ≥3=0.10), the tool
  records a human-review / manual re-analysis recommendation instead of broad
  automatic re-analysis.

## Components

- **21 skills**: analysis-init, analysis-conventions, analysis-orchestration,
  workspace-discovery, static-index, workspace-map, dependency-analysis,
  variable-list, erd, function-list, flowchart, business-rules,
  playwright-verify, sd, api-contract, batch-analysis, sa, sa-api, sa-batch,
  verify-spec, md-to-pdf.
- **16 agents**: deps, vars, erd, funcs, flow, rules, ui-verify, sd,
  api-contract, sa, quality-score, vspec-mock, vspec-static, vspec-e2e,
  vspec-report, vspec-patch.
- **4 commands**: start-analysis, verify-code, workspace-init, workspace-map.
- **scripts/extract/**: static-facts extraction CLI (see above).
- **templates/**: `analysis-profile.template.md` (per-repo profile card),
  `workspace-profile.template.md` (workspace/service registry card),
  `examples/analysis-profile.example.md` (filled reference example),
  `schemas/` (JSON schemas for DEPENDENCIES.json/FUNCTION-LIST.json/facts.json),
  `harness/` (run-state + handoff + verify-report templates), `pdf-style.css`.

## Profile cards

- **Per-repo** `.analysis-profile.md` records: identity, build system & tech
  stack, module/layer map (path globs), entry-point types, persistence
  conventions (schema prefix, id strategy, transaction managers),
  naming/pitfalls, output docs path, optional UI-verification config,
  glossary, harness state dir, and (§0) `service_id`/`service_kind`/`base_url`
  for workspace mode. Start from `templates/analysis-profile.template.md` or
  run `/analysis-init`.
- **Workspace** `.workspace-profile.md` (parent folder, only for multi-repo
  targets) records the service registry, cross-service call-matching notes,
  and workspace-level output/harness paths. Start from
  `templates/workspace-profile.template.md` or run `/workspace-init`.

Never put secrets in either card — record only env-var names.

## Notes & limitations

- Install/usage commands follow the Claude Code CLI; exact UI varies by version.
- The full-pipeline orchestration uses native Claude subagents (the Task tool).
- UI verification uses Mock HTML by default and does not touch a live
  environment unless the profile card §8 explicitly enables it.
- Static-facts extraction covers Java/Spring Boot (MyBatis + JPA) and
  Angular/Vue this pass; other stacks/languages are a documented gap for a
  future pass, not a silent failure — skills fall back to LLM-only reading.
- Route-table extraction (Angular `Routes`, Vue-router) isn't captured by the
  static-facts layer yet; output-path derivation still reads the router/layout
  file directly.
- JSON structured-output sidecars exist for DEPENDENCIES and FUNCTION-LIST
  this pass; the remaining 8 doc types are markdown-only for now.

## Validate (for contributors)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/validate-plugin.ps1
```
Checks manifest validity, agent/skill frontmatter, skill references, and absence
of project-specific hardcoding outside `templates/examples/`.

## License

MIT — see [LICENSE](LICENSE). Forked and extended from
[code-analysis-package](https://github.com/jin576tw/code-analysis-package).
