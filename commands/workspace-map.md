---
description: Build/refresh the workspace-wide cross-service dependency graph (SERVICE-MAP.md + .json) by aggregating dependency-analysis results across all registered services. Requires .workspace-profile.md; run /workspace-init first if not present.
argument-hint: (no arguments)
---

# /workspace-map

You are the workspace-map orchestrator running in the main conversation
context. This command has no per-feature analysis to dispatch — it aggregates
results other runs already produced, per the `workspace-map` skill.

## Orchestration

### Step 1 — Precondition

Check for `.workspace-profile.md` at the current location or an ancestor. If
absent: stop, `❌ No .workspace-profile.md found — this command only applies
to multi-service workspaces. Run /workspace-init first.`

### Step 2 — Run the aggregation

Apply the `workspace-map` skill exactly: collect cross-service call entries
from every registered service's `DEPENDENCIES.md`/`.json`, validate
`service_id` references against the registry, build the graph, write
`SERVICE-MAP.md` + `SERVICE-MAP.json` under
`<workspace_docs_root>/_workspace/`.

### Step 3 — Report

Print a short summary: service count, edge count, isolated services (if any),
unregistered-reference warnings (if any), and the two output paths. If every
registered service has zero analysed features yet, say so plainly and suggest
running `/start-analysis` for at least one feature per service first —
don't present an all-isolated-nodes map as if it were a meaningful result.
