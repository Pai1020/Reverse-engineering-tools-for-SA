---
description: Onboarding for a multi-repo workspace (separated frontend/backend, or several microservices under one parent folder). Discovers sibling repos, writes .workspace-profile.md, then runs analysis-init for every registered repo still missing its own .analysis-profile.md. Run this instead of /analysis-init when the target is a parent folder containing multiple repos.
argument-hint: [parent-folder-path]
---

# /workspace-init

**Target parent folder**: `$ARGUMENTS` (default: current directory)

If it's unclear whether the target is a single repo or a parent folder holding
several repos, ask the user before continuing — do not guess.

## Orchestration

You are the workspace onboarding orchestrator running in the main conversation
context. You dispatch skills; you do not invent registry facts yourself.

### Step 1 — Registry

Load skill `workspace-discovery` against the target parent folder. This
produces (or updates) `.workspace-profile.md` there. If the skill reports the
folder actually looks like a single repo (no second sibling repo found), stop
and tell the user to run `/analysis-init` instead — do not force workspace mode
on a single-repo target.

### Step 2 — Per-repo profiles

Read the service registry from `.workspace-profile.md` §2. For every row whose
`path/.analysis-profile.md` does not yet exist, load skill `analysis-init` with
that repo as the target, passing the already-confirmed `service_id`/`kind`/
`purpose`/`base_url` from the registry so the user isn't asked twice.

Report progress per service as each profile card is generated.

### Step 3 — Report

Summarise: workspace name, full service registry (service_id → kind →
purpose → path → profile status), and next steps:
- `/start-analysis analyse <Feature>` for a specific service (mention how to
  select which `service_id` if ambiguous),
- `/workspace-map` once at least two services have some analysis docs, to see
  the cross-service dependency graph.
