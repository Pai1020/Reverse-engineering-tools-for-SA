---
name: variable-list
description: Layer 2 analysis. Catalogs the fields/variables of a target function — UI fields, transport fields, persisted columns, constants, computed and state-control fields — and traces them across layers. Produces VARIABLE-LIST.md.
---

# Variable / Field List (Layer 2)

Produces `VARIABLE-LIST.md` for a target `<FUNCTION_NAME>`.

> **Read the profile card first** (`${CLAUDE_PROJECT_DIR}/.analysis-profile.md`)
> for the module/layer map, tech stack, persistence conventions and output path;
> auto-detect if absent. **Load skill `analysis-conventions`.** Reuse
> `DEPENDENCIES.md` if it already exists for this function.

Output: per profile §7, default `<docs_root>/<MODULE>/<FEATURE>/<PAGE>/<FUNCTION_NAME>/VARIABLE-LIST.md`.

## Analysis logic

### 1. Field discovery
- Controller/view-model member fields (UI-bound) + accessors.
- Objects constructed in service methods and which fields get set.
- Domain model / DTO properties.
- Data-access result mappings (column → property).
- UI template expression bindings.
- Constant-class static finals and enum values.
- Value-conversion maps (key → value).

### 2. Classification
- **UI fields**: bound in the view; distinguish read-only vs editable.
- **Persisted fields**: columns in the data-access result mapping → model property.
- **Transport fields**: parameters/returns passed between layers.
- **Constants/codes**: static finals, enums, lookup-table mappings.
- **Computed fields**: produced by logic, not directly mapped to storage.
- **State fields**: booleans controlling visibility / enablement / branching.

### 3. Type classification
Group by language types (text, integer, decimal/money, date/time, boolean,
collection, map). Note money types and date/time precision.

### 4. Usage analysis
Input / display / hidden / persisted (insert/update) / query-condition / control.

### 5. Field flow tracing
- UI input → controller property → service param → model property → storage.
- Storage → result mapping → model → controller → UI display.
- Note value-conversion points (external code → internal value).

## Output format

### 1. Summary counts
| Metric | Count |
|--------|-------|
| UI fields (editable) | n |
| UI fields (read-only) | n |
| Persisted fields | n |
| Constants/codes | n |
| Computed fields | n |
| State-control fields | n |
| Total | n |

### 2. UI field list (view ↔ controller)
Editable / read-only / table (grid) sub-tables, each with: label, binding
expression, controller property, type, UI component (editable case), description.

### 3. Persisted field list (data-access ↔ model), per table/collection
| Column | Storage type | Model property | Lang type | Operation | Description |

### 4. Constant / code tables
Per constant class: name, value, meaning, usage site. Plus value-conversion maps
(map name, source key, target value, meaning).

### 5. Field-flow diagram
ASCII columns: UI input → controller → service → storage, showing the binding
expression and the persisted column for each path.

### 6. State-control fields
| Field | Type | Controls (button/section) | Condition | Description |

### 7. Cross-layer mapping
| Label | UI expr | Controller prop | Service param | Model prop | Column | Table |

### Items needing human review
Append the human-review section (`analysis-conventions` §11). Focus on: semantic
meaning of code values, valid value domains, completeness of cross-system value
conversions.

## Self-check
- [ ] All UI binding expressions listed.
- [ ] All controller member fields listed.
- [ ] All model set operations traced.
- [ ] All result-mapping column↔property pairs listed.
- [ ] Constant values listed and confirmed against source.
- [ ] Each table/grid column listed; hidden fields flagged.
- [ ] Binding expression names exactly match controller property names.
- [ ] Lang type ↔ storage type mapping correct.
- [ ] Column names confirmed in the data-access layer (with schema prefix).
- [ ] Value-conversion maps complete; all branches covered; fallback noted.
- [ ] Same field's naming reconciled across layers (e.g. camelCase ↔ UPPER_SNAKE).
- [ ] Every field traces to real code; none invented.

## Common pitfalls (apply those relevant to the stack)
- A model property never set, then persisted → stored null.
- Full-write inserts/updates write unset properties as null; partial (selective)
  ones skip nulls / overwrite only non-nulls.
- Shared object references mutated elsewhere.
- External raw code used without conversion.
- UI radio/select bound value not matching the backend constant type.
- Money type comparison should use value compare, not equals (scale-sensitive).
