---
name: erd
description: Layer 2 analysis. Draws the entity-relationship diagram for a target function — tables/collections, models, UI entities, external-system structures, sequences — with cardinality, field-level mapping, value conversions and transaction boundaries. Produces ERD.md.
---

# ER Diagram (Layer 2)

Produces `ERD.md` for a target `<FUNCTION_NAME>`.

> **Read the profile card first** for the module/layer map, persistence
> conventions (schema prefix, id/sequence strategy, data sources/transaction
> managers) and output path; auto-detect if absent. **Load skill
> `analysis-conventions`** (diagram rules in §10). Reuse `DEPENDENCIES.md` /
> `VARIABLE-LIST.md` if present.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/ERD.md`.

## Analysis logic

### Step 1 — Entity identification
- **Storage entities**: tables/collections confirmed in the data-access layer
  (main / detail / log / lookup / event tables, etc.) — include schema prefix.
- **Model entities**: ORM-generated/hand-written models (+ query/example classes).
- **UI entities**: objects bound to the view (editable / read-only / grid source).
- **External-system entities**: structures sent to / received from service clients
  (report, archive, email, SMS gateways, etc.).
- **Sequences / id generators** per profile §5.

### Step 2 — Relationship mapping
- Storage relations via SQL JOINs, foreign keys, shared columns (annotate
  cardinality 1:1 / 1:N / N:1).
- model ↔ storage via result-mapping column → property.
- UI ↔ model via binding expressions.
- service ↔ data-access via injected calls.
- value-conversion relations (external → internal code maps).

### Step 3 — Attribute assignment
For each entity: primary key (from id tag / sequence), foreign keys (shared
columns), business fields (property ↔ column), storage type, language type,
operation (SELECT/INSERT/UPDATE/DELETE).

### Step 4 — Data-flow analysis
Trace UI input → controller → service param → model set → persist; and
storage → query → model → service return → controller → UI display.

## Output format

### 1. ER diagram
Prefer mermaid `erDiagram`; use ASCII (per `analysis-conventions` §10) when the
relationships are clearer as boxes. Annotate PK/FK, key fields, cardinality;
external systems as dashed boxes; UI entities as rounded boxes; sequences as
ovals. (Use generic placeholder names; do not invent relations not in code.)

### 2. Entity summary
| Entity | Source type | PK | Sequence | Key attributes | Related entities | Purpose |

### 3. Data-flow matrix
| Source entity | Flow | Target entity | Flow type | Business rule | Implementation |

### 4. Data-access ↔ table ↔ model mapping
| Table/collection | Mapper/repo | Mapping def | Model | Query/Example class | Sequence | Op |

### 5. Field-level ER mapping (column ↔ property)
| Column | Storage type | Model property | Lang type | UI binding | Op | Description |

### 6. Value-conversion diagram
ASCII showing external values → conversion map → internal values → column, with
the definition location.

### 7. External-system relationship diagram
ASCII showing the service and the external systems it calls.

### 8. Transaction boundary ↔ entity table
| Tx scope | Transaction manager / data source | Propagation | Entities involved | Notes (⚠️ cross-TM) |

### Items needing human review
Append the human-review section (`analysis-conventions` §11). Focus on:
inter-field business constraints, data lifecycle, cross-table consistency rules.

## Self-check
- [ ] Every table/collection in the data-access layer captured as an entity.
- [ ] Every sequence/id generator recorded.
- [ ] Every result-mapping column → property listed.
- [ ] Every injected data-access/service traced.
- [ ] UI-bound entities identified; external-system calls recorded.
- [ ] Value-conversion maps fully listed.
- [ ] Transaction propagation / manager annotated.
- [ ] Mapper/repo name matches the mapping namespace.
- [ ] Mapping column names match storage; property names match the model.
- [ ] Full vs partial write semantics distinguished.
- [ ] Hand-written data-access mapping references confirmed.
- [ ] Relations based on real JOINs / field usage, not assumed "standard" ones.
- [ ] Table names confirmed in queries (with schema prefix); endpoints confirmed.
- [ ] Cross-transaction-manager / cross-data-source risk annotated.
- [ ] ASCII/mermaid diagrams readable; naming consistent (storage UPPER_SNAKE,
      model camelCase) — adjust to the project's actual conventions.

## Common pitfalls (apply those relevant to the stack)
Full-write null overwrite; partial-write skipping nulls; shared object reference
side effects; external-vs-internal code mixing; new/independent transaction
surviving outer rollback; cross transaction-manager not in one transaction;
UI bound value vs backend constant mismatch; money-type equals vs value compare.
