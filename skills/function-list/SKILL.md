---
name: function-list
description: Layer 2 analysis. Lists all methods/functions involved in a target feature with signatures, layers, call hierarchy, transaction annotations, accessed storage, external calls and complexity; adds in-method flowcharts + storage/job impact for complex methods. Produces FUNCTION-LIST.md.
---

# Function List (Layer 2)

Produces `FUNCTION-LIST.md` for a target `<FUNCTION_NAME>`.

> **Read the profile card first** for the module/layer map, tech stack and
> output path; auto-detect if absent. **Load skill `analysis-conventions`.**
> For batch entry points also load `batch-analysis`. Reuse `DEPENDENCIES.md` /
> `VARIABLE-LIST.md` if present.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/FUNCTION-LIST.md`.
Also write a structured sidecar `FUNCTION-LIST.json` (same directory), schema
`templates/schemas/function-list.schema.json` — a projection of the same
methods/findings, regenerated together with the markdown, never drifting
out of sync.

## Analysis logic

### Step 1 — Entry-point identification
Find user/system entry points per the project's entry-point type (UI event
bindings, API endpoints, batch job triggers, scheduled tasks, page-init events);
map each to its public method; record the trigger condition (label, rendered/
disabled/visibility conditions).

### Step 2 — Call-chain tracing
From each entry method, trace layer by layer:
- **Controller/UI layer**: public methods (view-called), private helpers,
  injected service calls, utility calls.
- **Service layer**: transactional business methods, private helpers, data-access
  CRUD calls, other service calls, external service-client calls.
- **Data-access layer**: generated methods (insert/select/update/delete by key /
  by example) and hand-written extensions, with their queries and target tables.

### Step 3 — Method classification
UI-operation / validation / data-preparation / business-logic / data-access /
external-call / utility / value-conversion methods.

### Step 4 — Method documentation
For each method: signature (params + return), class & file location, layer,
transaction annotation (if any), downstream calls, upstream callers, accessed
tables + operation, external calls, business description, complexity.

### Step 5 — In-method flowcharts + storage/job impact (for high/medium complexity)
1. **In-method flowchart** (mermaid flowchart): internal step order, branches.
2. **Storage/job impact matrix**: next to each step note affected tables +
   operation, and any triggered job (with job id) and trigger type
   (writes trigger-data / direct HTTP-POST launch / job chain / event-driven).
3. **Job-trigger tracing**: if the method writes data later picked up by a
   scheduled job → "writes trigger-data"; if it launches a job directly →
   "direct launch". Use the `batch-analysis` skill / profile to confirm job
   scheduling and trigger timing.

## Output format

### 1. Method summary
| Method | Class | Layer | Trigger | Business purpose | Complexity |

### 2. Call-hierarchy tree
```
<FUNCTION_NAME> (description)
├── UI layer: <Controller>
│   └── <publicMethod>() ◄── triggered by <event>
│       ├── validate…()        — validation
│       ├── <serviceCall>()    — calls service
│       └── <ui-util>()        — message/box helper
├── Service layer: <Service>
│   ├── <businessMethod>()  [TX: propagation, manager]
│   │   ├── <dataAccess>.insert(entity) → <SCHEMA>.<TABLE>
│   │   └── if/else branching
│   └── <externalCall>()    → <external system>
├── Data-access (generated)
│   └── <Mapper>.insert() → <SCHEMA>.<TABLE>
├── Data-access (hand-written)
│   └── <MapperExt>.<query>() → <SCHEMA>.<TABLE>
└── Utilities / shared
    └── <util>() — purpose
```
(Use the project's real names; the above is a shape template.)

### 3. Detailed method docs
Per method: class, file location, layer, signature, transaction annotation,
trigger, business description, processing steps, downstream calls, upstream
callers, accessed storage + op, external calls, complexity. For high/medium
complexity add the in-method flowchart and storage/job impact matrix from Step 5.

### Items needing human review
Append the human-review section (`analysis-conventions` §11). Focus on: exact
external endpoints, actual config/property values, job trigger timing.

## Self-check
- [ ] All entry points identified from real UI/API/batch bindings.
- [ ] Call chain traced through every layer (controller → service → data-access).
- [ ] Each method's signature matches source exactly.
- [ ] Transaction annotations (propagation + manager) recorded.
- [ ] Accessed tables + operation recorded per method (with schema prefix).
- [ ] External service-client calls recorded with endpoints.
- [ ] Upstream callers / downstream calls cross-linked.
- [ ] High/medium complexity methods have in-method flowchart + impact matrix.
- [ ] Job triggers classified (writes trigger-data / direct launch / chain / event).
- [ ] Every conclusion traces to real code; no invented methods or signatures.
- [ ] `FUNCTION-LIST.json` written alongside the markdown, from the same findings.
