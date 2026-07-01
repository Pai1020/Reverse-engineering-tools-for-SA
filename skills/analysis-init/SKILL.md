---
name: analysis-init
description: Onboarding / preliminary step. First confirms with the user whether the target is a single repo or a parent folder holding multiple repos (delegating to workspace-discovery if multiple), then explores the target project (build files, directory layout, entry points) and interviews the user, then generates the project profile card `.analysis-profile.md` that every other analysis/verification tool reads. Run this first in any new project.
---

# analysis-init — generate the project profile card

This is the **first thing to run** in a new project. The whole toolkit is
project-agnostic: it relies on a per-project **profile card**
(`.analysis-profile.md` at the project root) to know where things live and what
the tech stack is. This skill produces that card by **exploring the project and
asking the user**.

> Template: `${CLAUDE_PLUGIN_ROOT}/templates/analysis-profile.template.md`
> Filled example: `${CLAUDE_PLUGIN_ROOT}/templates/examples/analysis-profile.example.md`
> Methodology: load skill `analysis-conventions` (anti-hallucination — confirm
> from real files, never guess).

## When to use

- A project has no `.analysis-profile.md` yet.
- The project structure changed and the card is stale (re-run to update).

## Procedure

### Step 0 — Confirm single-repo vs multi-repo scope (always ask)

**Before anything else**, determine whether the target is one repository or a
parent folder containing several (separated frontend/backend, or
microservices checked out side by side):

1. Scan the target folder's immediate children for repo/build markers
   (`pom.xml`, `build.gradle`, `package.json`, `angular.json`, `go.mod`,
   `*.csproj`, `pyproject.toml`/`requirements.txt`, or a `.git` directory) —
   same detection the `workspace-discovery` skill uses.
2. **Always ask the user to confirm**, even if auto-detection seems obvious —
   do not silently assume single-repo just because the invocation didn't
   mention "workspace", and do not silently assume multi-repo just because
   multiple marker-bearing folders were found (a monorepo with one logical
   service can still have several `package.json`s). Present what was
   detected as a default suggestion, e.g.: *"Found build markers in
   `billing-api/` and `billing-ui/` — is this one project with multiple
   repos (confirm as a workspace), or should I treat `<target>` itself as
   the single repo to analyse?"*
3. **If multiple repos confirmed**: stop this skill's single-repo flow and
   load skill `workspace-discovery` instead — it builds the service registry
   (`.workspace-profile.md`), and for each registered repo asks the user its
   **functional purpose** (see that skill's Step 3) before dispatching this
   same `analysis-init` skill once per repo.
4. **If single repo confirmed**: continue to Step 1 below as normal.

### Step 1 — Detect whether a card already exists
- Check for `${CLAUDE_PROJECT_DIR}/.analysis-profile.md`.
- If present, summarise it and ask the user: **update** or **keep**. Do not
  silently overwrite.

### Step 2 — Auto-explore the project (evidence first)
Gather facts from the real repository (every claim must be backed by a file):

1. **Build system & language**: look for `pom.xml`, `build.gradle`,
   `package.json`, `pyproject.toml`/`requirements.txt`, `Cargo.toml`, `go.mod`,
   `*.csproj`, etc. Read them to extract frameworks, dependencies, build/test
   scripts.
2. **Module layout**: list top-level directories; for multi-module builds read
   the aggregator (e.g. Maven `<modules>`) to enumerate modules.
3. **Layer locations**: search for conventional markers to locate each layer:
   - services/business logic, controllers/UI, data-access (repos/DAOs/mappers),
     domain models/DTOs, constants/enums, batch jobs, API controllers.
   - Use language-appropriate signals (annotations like `@Service`,
     `@RestController`, `@WebService`; folders like `repository/`, `mapper/`,
     `controllers/`, `pages/`).
4. **Entry-point types**: determine which of UI / SOAP-WS / REST / Batch / CLI
   exist, and note how a feature's entry point is located in this project.
5. **Persistence**: detect ORM, DB, schema prefix usage in queries, id/sequence
   strategy, multiple data sources / transaction managers.
6. **Conventions/pitfalls**: note generated-vs-handwritten code, constant-class
   patterns, anything that affects correct analysis.

Keep a short evidence log (which file proved each fact).

### Step 3 — Interview the user (fill the gaps)
Ask only what auto-exploration could not confirm. Batch the questions; suggest
detected defaults so the user can confirm quickly. Cover:

- Confirm/adjust the detected **module/layer map** (the path globs).
- **Output docs root** and path convention (default `.analysis/docs` with
  `<module>/<feature>/<page>/<function>/<TYPE>.md`).
- **Entry-point types** to enable and how to find an entry point.
- **UI verification** config: app base URL + login flow, or N/A (skips ui-verify).
- **Schema prefix / table naming / sequence strategy** if a DB is used.
- **Domain glossary** terms worth recording (optional).
- **Harness state dir** (default `.analysis/harness`).

Never put secrets in the card — record only the *name* of an env var for any
credential.

### Step 4 — Generate the card
- Start from the template, fill every section from Step 2–3 evidence.
- For anything still unknown, leave the template placeholder and add a
  `> TODO: confirm` note so downstream skills fall back to auto-detection.
- Write to `${CLAUDE_PROJECT_DIR}/.analysis-profile.md`.

### Step 5 — Report
- Summarise the card (project name, layer map, enabled entry types, output root).
- List any TODO/unconfirmed fields.
- Tell the user the next step: run `/start-analysis` for full analysis, or an
  individual skill (e.g. `/dependency-analysis`).

## Fallback contract for other skills

Every other skill in this plugin follows this contract:
1. Read `${CLAUDE_PROJECT_DIR}/.analysis-profile.md` if present and use its
   facts (paths, tech stack, schema prefix, output convention).
2. If absent, **auto-detect** the minimum needed (read build files / scan dirs),
   proceed, and recommend running `/analysis-init` for better results.
