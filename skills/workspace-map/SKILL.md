---
name: workspace-map
description: Aggregates every registered service's cross-service dependency findings (from dependency-analysis §3.1) into one workspace-wide SERVICE-MAP.md + SERVICE-MAP.json graph — the "N repos, one folder" payoff artifact. Requires .workspace-profile.md. Run after at least two services have some DEPENDENCIES output.
---

# workspace-map — cross-service dependency graph

Produces a workspace-level view of which service calls which, aggregated from
individual `dependency-analysis` runs across the registered services. This is
what turns per-repo analysis into an actual multi-service map instead of N
disconnected document trees.

> Requires `.workspace-profile.md` (see `workspace-discovery`). If absent, stop
> and tell the user this skill only applies to multi-service workspaces.

## Inputs

- `.workspace-profile.md` §2 (service registry) and §4 (workspace docs root).
- Every registered service's analysed features under
  `<docs_root>/<SERVICE>/.../DEPENDENCIES.md` (+ `.json` sidecar if present —
  see `dependency-analysis`'s structured-output extension).

## Procedure

### Step 1 — Collect cross-service call entries

For each registered `service_id` in the workspace registry, find every
`DEPENDENCIES.md` under that service's doc tree:
- **Prefer the JSON sidecar** (`DEPENDENCIES.json`, same directory) if present:
  read its `cross_service_calls` array directly — no markdown parsing needed.
- **Else parse the markdown table**: the "Cross-service calls" section (§3.1
  of `dependency-analysis`), columns `Caller endpoint/method | Callee
  service_id | Best-guess path | Protocol | Confidence | Evidence`. Skip files
  with no such section (nothing to aggregate for that feature).

Do not re-derive cross-service calls yourself by reading source — this skill
only aggregates what `dependency-analysis` already found and tagged. If a
service has no analysed features yet, it still appears as a node (isolated,
no edges) so the map reflects the full registry, not just what's been analysed.

### Step 2 — Validate service_id references

Every `Callee service_id` collected must match a `service_id` in the workspace
registry exactly. A mismatch is not a typo to silently fix — flag it: `⚠️
DEPENDENCIES.md at <path> references unregistered service_id "<x>" — confirm
against .workspace-profile.md §2 (rename in the registry, or re-run
dependency-analysis if the call was misclassified)`.

### Step 3 — Build the graph

Nodes = every registered `service_id` (from the registry, not just ones with
edges). Edges = one per aggregated cross-service call entry: `caller_service →
callee_service` with the endpoint, protocol, confidence, and source
DEPENDENCIES.md path as edge metadata. Multiple calls between the same pair
stay as separate edges (don't collapse — the count itself is informative).

### Step 4 — Write outputs

Write to `<workspace_docs_root>/_workspace/SERVICE-MAP.md`:
- A mermaid `flowchart LR` with one node per service (labelled `service_id
  (kind)`) and one edge per call (labelled `<protocol> <path>`).
- A table below it: `Caller | Callee | Endpoint/Path | Protocol | Confidence |
  Source doc`.
- An "Isolated services" list (registered but no inbound/outbound edges found).
- An "Unregistered references" list (Step 2 flags), if any.

Also write `<workspace_docs_root>/_workspace/SERVICE-MAP.json`:
```json
{
  "generated_at": "<ISO-8601>",
  "nodes": [{ "service_id": "...", "kind": "...", "path": "..." }],
  "edges": [{ "caller": "...", "callee": "...", "endpoint": "...", "protocol": "...", "confidence": "...", "source_doc": "..." }],
  "unregistered_references": ["..."]
}
```

### Step 5 — Report

Summarise: N services, M edges, any isolated services or unregistered
references found. Point to the two output paths.

## Self-check
- [ ] Every registered service appears as a node, even with zero edges.
- [ ] No edge references a `service_id` outside the registry without being
      flagged in "Unregistered references".
- [ ] Edges preserve confidence/evidence from the source DEPENDENCIES doc —
      not upgraded to certainty during aggregation.
- [ ] JSON and markdown outputs describe the same graph (no drift between them).
