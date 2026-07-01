---
name: flowchart
description: Layer 3 analysis. Draws the flowcharts for a target function — user-operation flow, method-call flow, branching logic, transaction boundaries, error handling, external-system interaction — using mermaid (ASCII fallback). Records a reasoning trail. Produces FLOWCHART.md.
---

# Flow Chart (Layer 3)

Produces `FLOWCHART.md` for a target `<FUNCTION_NAME>`.

> **Flow-first principle (`analysis-conventions` §6):** confirm the real
> execution flow from code before deriving anything. **Read the profile card**
> for the module/layer map, entry-point types and output path; auto-detect if
> absent. **Load skill `analysis-conventions`** (diagram rules §10, reasoning
> trail §5). Reuse DEPENDENCIES / VARIABLE-LIST / FUNCTION-LIST / ERD if present.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/FLOWCHART.md`.

## Diagram format
Primary mermaid: `flowchart TD` (main flow/branching), `sequenceDiagram` (call
sequence across layers/systems), `stateDiagram-v2` (status machines),
`flowchart TD` + subgraph (transaction boundaries). ASCII fallback for complex
nested boundaries, data-flow tables, precise side-by-side comparison.

## Analysis scope
1. **User-operation flow**: from UI event/entry point to backend processing.
2. **Method-call flow**: controller → service → data-access call chain.
3. **Branching logic**: if/else / switch decisions.
4. **Transaction boundaries**: transactional scope and cross-TM relationships.
5. **Error handling**: try/catch, error handlers, validation-failure paths.
6. **External-system interaction**: service-client call sequence and data flow.

## Analysis logic
- **Step 1 — Overview**: identify function type (UI / batch / REST / WS), entry
  point, controller scope, business purpose.
- **Step 2 — Main structure**: trace from the entry method; map all decision
  structures and conditions; identify loops; record exit points.
- **Step 3 — Call hierarchy**: trace controller → service → data-access;
  distinguish always-called vs conditional; annotate transaction boundaries;
  record external-system call points.
- **Step 4 — Data flow & error handling**: trace data UI → controller → service
  → data-access → storage; map error-handling paths; record validation-failure
  paths; trace value-conversion points.
- **Step 5 — Reasoning trail (mandatory)**: after each diagram, add reasoning
  notes explaining how the flow was derived from code. Mandatory for:
  non-intuitive control flow (new/independent transactions, cross-TM), implicit
  execution order, missing branches (uncovered switch values), assumptions about
  external behaviour. Format:
  ```markdown
  ### Reasoning notes
  | # | Flow step | Inference source | Code location | Confidence | Note |
  ```
  Confidence: High (annotation/logic), Medium (structure-inferred), Low (needs
  human verification — external behaviour, runtime ordering).

## Output format
1. **Overview**: name, business purpose, entry point (`<Controller>.<method>()`
   ← trigger), module, tables involved, external systems.
2. **High-level flow (user perspective)** — mermaid flowchart.
3. **Method-call flow** — mermaid flowchart / sequenceDiagram.
4. **Branching logic** — per decision, the condition and branches (note any
   uncovered value).
5. **Transaction boundaries** — flowchart + subgraph, ⚠️ cross-TM annotated.
6. **Error-handling flow**.
7. **External-system interaction** — sequenceDiagram.
8. **Reasoning notes** (per §5).

### Items needing human review
Append the human-review section (`analysis-conventions` §11).

## Self-check
- [ ] Flow confirmed from real code before any rule inference.
- [ ] Every decision/branch traced to a code condition; uncovered values flagged.
- [ ] Transaction boundaries + cross-TM relationships annotated.
- [ ] Error/validation-failure paths mapped.
- [ ] External call sequence recorded.
- [ ] Reasoning notes attached for every non-intuitive conclusion.
- [ ] mermaid node IDs in English; risk nodes carry ⚠️.
