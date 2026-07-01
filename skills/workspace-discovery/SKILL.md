---
name: workspace-discovery
description: Onboarding step for multi-repo workspaces. Scans a parent folder for sibling repos (separated frontend/backend, or several microservices checked out side by side), proposes a service registry, interviews the user to confirm/classify each, and writes the workspace profile card `.workspace-profile.md`. Run this once, before `analysis-init`, when the target is not a single repo. Does not replace `analysis-init` — each discovered repo still gets its own `.analysis-profile.md`.
---

# workspace-discovery — generate the workspace profile card

Use this when the thing being analysed is **not one repo** but a parent
folder containing several repos (a separated frontend + backend, or N
microservices side by side). It produces `.workspace-profile.md` — the
service registry every workspace-aware skill/command reads before falling
back to single-repo behaviour.

> Template: `${CLAUDE_PLUGIN_ROOT}/templates/workspace-profile.template.md`
> This skill only builds the **registry**. Per-repo facts (module/layer map,
> tech stack, output path) are still each repo's own job via `analysis-init`
> — this skill hands off to it, one repo at a time, after the registry exists.

## When to use

- The user's target is a parent folder with 2+ repos in it (ask if unclear —
  don't assume single-repo just because the invocation didn't say "workspace").
- A `.workspace-profile.md` already exists but a repo was added/removed/renamed
  (re-run to update; summarise the existing card and ask update vs keep, same
  as `analysis-init`'s Step 1 — never silently overwrite).

## Procedure

### Step 1 — Detect whether a workspace card already exists
Check for `.workspace-profile.md` at the parent folder. If present, summarise
and ask **update / keep**.

### Step 2 — Discover candidate repos (evidence first)
List immediate child directories of the parent folder. For each, check for a
recognizable repo/build marker: `pom.xml`, `build.gradle`, `package.json`,
`angular.json`, `vue.config.js`/`vite.config.*`, `go.mod`, `*.csproj`,
`pyproject.toml`/`requirements.txt`, or a `.git` directory. Treat each match
as a **candidate service**. Do not recurse deeper than one level unless the
top level is clearly just a container (e.g. a folder with no marker of its
own that itself holds marker-bearing subfolders).

For each candidate, gather enough evidence to propose a classification:
- **kind**: frontend (has `angular.json`/`vue.config`/`index.html` + framework
  deps), backend (has a server framework / exposes ports / has controllers),
  shared-lib (no entry point, imported by others), gateway (routing config,
  e.g. nginx/api-gateway config), or other.
- **primary language/framework**: from the build file's dependencies.
- **base_url / aliases**: look for a default port/host in config
  (`application.yml`/`application.properties`, `environment.ts`,
  `docker-compose.yml`, `.env*`) — if genuinely unknown, leave "N/A" and ask
  in Step 3 rather than guessing.

### Step 3 — Interview the user (fill the gaps)
Batch questions, suggest detected defaults for quick confirmation:
- Confirm/adjust each candidate's `service_id` (short, unique, stable —
  this is the join key used everywhere downstream), `kind`, and base_url/aliases.
- Any known **cross-service call matching** indirection (service-discovery
  name, API-gateway path prefix, env var indirection) that a literal base_url
  match wouldn't catch — record in §3 of the card.
- Any known **genuine external systems** (not in the registry) that should
  never be mistaken for a sibling service — record in §3 so `dependency-analysis`
  doesn't try to match them.
- Workspace docs root / harness dir (defaults: `.analysis/docs`, `.analysis/harness`,
  both at the parent folder, per template §4).
- Anything intentionally excluded from the registry (e.g. an archived repo).

### Step 4 — Generate the card
Fill `templates/workspace-profile.template.md` from Steps 2–3 evidence, write
to `.workspace-profile.md` at the parent folder.

### Step 5 — Hand off to per-repo analysis-init
For every registered service whose repo does not yet have its own
`.analysis-profile.md`, run the `analysis-init` skill for that repo — it
follows its normal procedure unchanged, plus fills the new §0
(`service_id`/`service_kind`/`base_url`) using the values already confirmed
in Step 3 instead of asking again.

### Step 6 — Report
Summarise the registry (service_id → kind → path), list any service still
missing a profile card, and tell the user the next step: `/workspace-init`
(if more repos still need profiles) or `/start-analysis` / an individual
skill for a specific service.

## Fallback contract

Every workspace-aware skill/command follows this contract:
1. If `.workspace-profile.md` exists at (or above) the current target, use it
   to resolve `service_id`, cross-service matching rules, and workspace-level
   paths.
2. If absent, proceed exactly as single-repo mode — do not require this file,
   do not ask the user to create one unless they've indicated multiple repos
   are involved.
