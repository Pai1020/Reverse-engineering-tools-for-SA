---
name: static-index
description: Deterministic static-facts extraction layer. Documents when/how to run the tree-sitter-based extractor (scripts/extract/index.js) that produces facts.json — a per-repo, AST/XML-derived ground truth for symbols, endpoints, outbound calls, and DB access — and the consult-first contract other skills follow before free-reading source. Load this before dependency-analysis on any repo whose stack is covered (Java/Spring Boot, Angular, Vue).
---

# static-index — deterministic facts extraction

Analysis skills reason over code with an LLM, which can hallucinate signatures,
endpoints, or table names that "look right" but aren't real. This skill adds a
**deterministic pre-pass**: a tree-sitter/XML-based extractor parses source
once per repo and writes `facts.json` — plain data, no interpretation — that
skills consult as ground truth before reasoning.

This is additive, not a replacement for reading source: `facts.json` answers
"does this symbol/endpoint/table exist and where", never "why does this code
behave this way". Logic, business rules, and flow still require reading the
actual source.

## Coverage (this pass)

| Stack | Extractor | Facts captured |
|-------|-----------|-----------------|
| Java (Spring Boot) | `scripts/extract/java.js` | Classes/interfaces, methods+signatures, Spring annotations (REST endpoints w/ verb+path, DI edges), outbound HTTP client calls, imports |
| Java + MyBatis | `java.js` (mapper interface markers) + `mybatis-xml.js` | MyBatis mapper interface markers; statement id/type, referenced tables (SQL scan), parameterType/resultType/resultMap from the mapper XML (`source: "mybatis-xml"`) |
| Java + JPA (Spring Data) | `java.js` | `@Entity` classes + `@Table(name=...)` → table name; repository interfaces extending `JpaRepository`/`CrudRepository`/etc. → entity+id generic types; `@Query` methods (JPQL → `entity_type`, native → real `tables` via SQL scan) and derived-query methods (`findByXAndY` → parsed `criteria_fields`), tagged `source: "jpa-query-jpql" \| "jpa-query-native" \| "jpa-derived"` |
| Angular | `scripts/extract/frontend.js` (mode `ts`) | `@Component`/`@Injectable` classes, `HttpClient` outbound calls, imports |
| Vue (SFC) | `scripts/extract/frontend.js` (mode `vue`) | `<script>` block parsed as TS/JS; `axios`/`this.$axios`/`this.$http` outbound calls, imports |

A backend repo may mix MyBatis and JPA (or use only one) — both extractors
always run; whichever pattern isn't present in a given file simply produces
no entries for that source. When a JPQL/derived-query `db_access` entry only
has `entity_type` (no `tables`), resolve the real table name by looking up
that entity's own `symbols[].table_name` elsewhere in `facts.json` (same repo,
possibly a different file) — do not guess a table name from the entity name.

**Known gap (documented, not built this pass)**: route-table extraction
(Angular `Routes` config, Vue-router config) is not captured. Route/tab
structure for output-path derivation still comes from reading the router/layout
file directly, per `analysis-orchestration`. Any language/framework beyond the
table above falls back to the pre-existing LLM-only reading — this skill is
silently a no-op there.

## Running the extractor

```
cd <plugin_root>/scripts/extract && npm install   # one-time, needs network
node index.js <repo_path> --service <service_id>  # --service optional in single-repo mode
```

Writes `<repo_path>/.analysis/index/<service_id or "default">/facts.json` plus
a `.cache.json` (content-hash keyed) so re-running only re-parses changed
files. Re-run whenever source changes meaningfully before a fresh
`dependency-analysis` pass — a stale facts.json is worse than none (see the
staleness rule below).

Schema: `scripts/extract/schema/facts.schema.json`. Top-level shape:
`{ service_id, generated_at, files: [{ path, language, symbols, endpoints, outbound_calls, db_access, imports }] }`.

## Consult-first contract

Before tracing dependencies/signatures/tables by reading raw source, a skill
should:
1. Check whether `<repo>/.analysis/index/<service_id or "default">/facts.json`
   exists. If not, proceed exactly as before this skill existed (full LLM read,
   recommend running the extractor for next time).
2. If present, look up the target file/symbol in `facts.json` first:
   - **Endpoint/method/table claims that match `facts.json` exactly**: cite
     `facts.json` alongside the source line — this is ground truth, not a guess.
   - **A claim that contradicts `facts.json`** (e.g. you believe a method has
     3 parameters but `facts.json` records a different signature) is a **hard
     error**: stop and re-read the actual source at the cited line before
     writing anything — do not average the two into a low-confidence guess.
   - **Something facts.json doesn't cover** (business logic, why a branch
     exists, anything outside the coverage table above): read source as usual;
     facts.json being silent here is expected, not a gap to flag.
3. **Staleness check**: compare `facts.json`'s `generated_at` against the
   target file's own modification evidence if available (e.g. recent edits
   mentioned by the user). If the repo has clearly changed since generation
   and re-running the extractor is feasible, recommend re-running it before
   relying on it for that file; otherwise note staleness risk in the
   human-review section rather than silently trusting old facts.

## Cross-service resolution (used by dependency-analysis)

`facts.json`'s `outbound_calls[].url_expression` is what `dependency-analysis`
§3 matches against `.workspace-profile.md`'s per-service `base_url`/aliases to
tell a genuine cross-service call apart from a third-party external system —
see that skill and `workspace-map`.
