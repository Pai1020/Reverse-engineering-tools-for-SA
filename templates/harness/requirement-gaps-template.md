---
feature: <FEATURE>
service: <service_id or null>
generated_at: <ISO-8601>
counts:
  open: N
  answered: N
  resolved: N
---

# <FUNCTION_NAME> — Requirement Gaps

> Consolidated from every produced doc's "⚠️ Items needing human review"
> section (`analysis-conventions` §11) plus any structural
> `quality/<stage>-gap-report.md` for this feature. One row per distinct
> question — duplicates raised by more than one doc are merged (see "Raised
> in" column). Produced by the `requirement-gaps` skill (Consolidate step).

---

## Open

| id | item | speculation | source | confidence | impact (stage/doc) | raised in | answer |
|----|------|-------------|--------|-----------|--------------------|-----------|--------|
| deps-01 | (question to confirm) | (current guess) | code comment / naming / context | low/med/high | which stage/doc changes if corrected | DEPENDENCIES, ERD | *(fill in to close this gap)* |

> **How to close a gap**: fill the `answer` column above (or answer inline in
> conversation and ask to have it recorded here), then run
> `/gap-review <Feature> apply` — this maps each answered row's `impact` to
> the affected stage(s) and dispatches a **targeted** re-analysis (Mode B),
> not a full re-run. Rows move to Answered immediately, then to Resolved once
> the regenerated doc no longer raises the same question.

---

## Answered (awaiting confirmation the doc was regenerated)

| id | item | answer | dispatched stage(s) | status note |
|----|------|--------|----------------------|-------------|
| — | — | — | — | — |

---

## Resolved

| id | item | answer | resolved at |
|----|------|--------|-------------|
| — | — | — | — |

---

*Stable ids are append-only per stage (`<stage>-<n>`) — never renumbered
across re-runs, so status here survives re-analysis. Ids are retired, not
reused, once resolved.*
