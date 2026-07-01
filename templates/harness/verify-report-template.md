---
verify_round: N
threshold: 0.XX
prior_diff_rate: null
legacy_source: null
---

# <FUNCTION_NAME> — Verify Report

> Review date: YYYY-MM-DD
> Subject: `<docs_root>/<MODULE>/<FEATURE>/<PAGE>/<FUNCTION_NAME>/SD.md`
> Compared against: actual code (<key source files>)
> Method: three-layer comparison (mock(A) ↔ real code(B) ↔ SD(C)); UI entry
> points also get dynamic E2E verification.
> Produced by: verify-spec mini-orchestrator (vspec-mock → vspec-static → vspec-report)

---

## §1 Quality gate summary

| Stage | Score / 10 | Gate | Attempts | Scorecard | Gap report |
|-------|------------|------|----------|-----------|------------|
| deps | N/A | N/A | 0 | N/A | N/A |

> `quality_score` measures analysis-document quality. `diff_rate` below measures
> spec-vs-code consistency. Treat them as separate signals.

---

## §2 Summary stats

| Metric | Value |
|--------|-------|
| Total reviewed items | N |
| ✅ Correct | N (X%) |
| ⚠️ Omission (code has it, SD doesn't) | N (X%) |
| ❌ Wrong (SD contradicts code) | N (X%) |
| **diff_rate (omission + wrong)** | **N items, X%** |
| Resolved threshold (round N) | X.XX (XX%) |
| E2E UI diffs (UI entry points only) | N / N/A (non-UI) |

> Formula: `diff_rate = (❌ wrong + ⚠️ omission) / total reviewed items`.
> Mode B (linked-update): denominator is only items in the re-analysed stages.
> Threshold tightens by verify_round: round 1=0.20, round 2=0.15, round ≥3=0.10.
> When diff_rate > resolved threshold, the orchestrator recommends human review
> and structural re-analysis only when confirmed.

---

## §3 Difference detail

### ❌ Wrong (SD contradicts code)

#### D-XX: <title>
- **SD location**: §N.N <section>
- **Owner doc**: `SD.md` + `<sibling-doc-or-N/A>`
- **Patch class**: patchable-localized | structural-defer
- **SD says**: <SD's text>
- **Real code** (`<File>` line N):
  ```
  <key snippet>
  ```
- **Difference**: <why SD contradicts code>
- **Impact**: <which SD sections and sibling docs>

### ⚠️ Omission (code has it, SD doesn't)

#### D-XX: <title>
- **SD location**: <related section or "not mentioned">
- **Owner doc**: `SD.md` + `<sibling-doc-or-N/A>`
- **Patch class**: patchable-localized | structural-defer
- **Real code** (`<File>` line N):
  ```
  <key snippet>
  ```
- **Difference**: <behaviour present in code but absent from SD>
- **Impact**: <which SD sections and sibling docs>

---

## §4 Confirmed correct

| # | SD location | Confirmed content | Code evidence |
|---|-------------|-------------------|---------------|
| C-01 | §N.N | <content> | <File> line N |

---

## §5 UI behaviour (E2E) differences

> UI entry points only. Otherwise: **N/A (entry point is <WS/REST/Batch>)**

| # | Test case | Operation | Documented | Observed | Type | Section |
|---|-----------|-----------|-----------|----------|------|---------|
| E-01 | <TC> | <op> | <doc> | <observed> | ❌/⚠️ | §N.N |

---

## §6 Doc coverage matrix

| Diff id | Patch class | SD.md | Sibling owner doc | Pending human? | Recommended next action |
|---------|-------------|-------|-------------------|----------------|--------------------------|
| D-XX | patchable-localized | §N.N | VARIABLE-LIST.md | No | Patch localized sections |

---

## §7 Recommended fixes

> Localised omissions and errors are patched back by `vspec-patch` (code is the source of truth).
> Structural-defer items produce a human-gated rerun recommendation instead of automatic broad rewriting.

| Priority | Diff id | Patch class | Fix action | Affected SD section | Affected sibling doc |
|----------|---------|-------------|------------|---------------------|----------------------|
| High | D-XX | patchable-localized | <action> | §N.N | <doc or N/A> |

---

## §8 Overall assessment

<3-5 sentences: core architecture correctness; where differences cluster
(architecture / signatures / implementation detail); the most notable risk;
whether human confirmation is required.>

---

*Produced by verify-spec three-layer comparison (mock + static code + SD).*
*Static comparison does not cover: real external-system behaviour, runtime data,*
*environment-specific config. E2E UI verification (if run) uses Mock HTML by*
*default and does not connect to a live environment.*