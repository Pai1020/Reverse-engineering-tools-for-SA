---
name: sd
description: Layer 4a. Produces the System Design (SD) document for developers — architecture, entry-point annotation, component responsibilities, method decomposition, data flow, transaction strategy, integration points, exception paths, target-architecture mapping & API boundaries. Produced before SA. Produces SD.md.
---

# System Design (SD, Layer 4a)

Produces `SD.md` for a target `<FUNCTION_NAME>`. Audience: **developers**.

> **Read the profile card** for the module/layer map, tech stack and output
> path; auto-detect if absent. **Load skill `analysis-conventions`** (SD tone in
> §9). Required inputs (if present): DEPENDENCIES, FUNCTION-LIST, FLOWCHART;
> auxiliary: VARIABLE-LIST, ERD, BUSINESS-RULES.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/SD.md`.

## Core principle
Answer: what does the architecture look like; why designed this way; where do
components map in the target architecture; where are the API boundaries; how does
data flow. Annotate the entry-point path (UI → backend service → data access).
Keep technical detail (method decomposition, I/O specs, exception paths). Do not
translate code line-by-line or list every accessor.

## Analysis logic
- **Step 1 — from DEPENDENCIES**: services/data-access/external deps → component
  responsibilities + dependency matrix; transaction settings → transaction
  strategy; value-conversion maps → data flow; external calls → integration points.
- **Step 2 — from FUNCTION-LIST**: entry-point methods + triggers → entry-point
  annotation; call hierarchy → architecture diagram + method decomposition;
  branching → data flow; I/O specs.
- **Step 3 — from FLOWCHART**: end-to-end flow → architecture diagram;
  transaction-boundary flow → transaction strategy; error handling → consistency
  risk + exception paths; navigation → navigation patterns.
- **Step 4 — synthesis**: map components to target-architecture layers; identify
  API boundaries; cross-check docs for inconsistencies/gaps.

## Output structure
Header: function name, analysis date, entry point, program type
(UI/Service/Batch/REST/WS), module, referenced docs.

- **§1 Design overview**: summary; tech stack & dependency matrix
  (type / component / usage / criticality / source ref).
- **§2 System architecture**: architecture diagram, entry-point annotation,
  component responsibilities.
- **§3 Method decomposition + I/O specs + navigation patterns**.
- **§4 Data flow**: cross-layer communication, data structures, state transitions,
  value conversions.
- **§5 Transaction strategy**: boundaries, propagation, transaction manager /
  data source, consistency risks (⚠️ cross-TM).
- **§6 Integration points**: external system calls, the contract boundary.
- **§7 Exception paths**: error handling, rollback behaviour, recovery.
- **§8 Design decisions**: the "why" of key choices.
- **§9 Target-architecture mapping & API-boundary identification**: where each
  current component belongs in the target architecture; which calls need a
  defined contract.

### Items needing human review
Append the human-review section (`analysis-conventions` §11).

## Self-check
- [ ] Entry-point path annotated end to end.
- [ ] Dependency matrix complete with source refs.
- [ ] Transaction strategy with propagation + manager; cross-TM risk flagged.
- [ ] Integration points identify the contract boundary.
- [ ] Exception/rollback paths described.
- [ ] Target-architecture mapping + API boundaries identified.
- [ ] Technical detail kept; no line-by-line code translation; traces to code.
