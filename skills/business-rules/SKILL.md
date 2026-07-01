---
name: business-rules
description: Layer 3 analysis. Extracts the business rules of a target function in business language — what the rule is, why it exists, what happens when violated, how rules relate — using Given-When-Then for key rules. Tracks the inference source of every rule (comments are speculation). Produces BUSINESS-RULES.md.
---

# Business Rules (Layer 3)

Produces `BUSINESS-RULES.md` for a target `<FUNCTION_NAME>`.

> Derive rules **after** the flowchart confirms real execution flow
> (`analysis-conventions` §6). **Read the profile card** for the module/layer
> map and output path; auto-detect if absent. **Load skill `analysis-conventions`.**
> Reuse DEPENDENCIES / VARIABLE-LIST / FUNCTION-LIST / ERD / FLOWCHART if present.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/BUSINESS-RULES.md`.

## Core principle
Readers need: (1) what rules exist, (2) **why** each exists (business reason, not
"the code says so"), (3) what happens when violated, (4) how rules relate
(ordering, mutual influence).

- ❌ Avoid: listing raw `if (x == null) errorhandler(...)` as a rule; treating
  every if/else as a rule (some are implementation detail).
- ✅ Prefer: business-language statements; Given-When-Then for key rules;
  annotate the business source (regulation? internal policy? system constraint?).

## Speculation tracking (this skill's distinctive rule)
Every rule must carry an **inference source** so reviewers can judge correctness.

- Code comments are **speculation**, not fact (may be stale/wrong).
- Code behaviour is fact (if/else, calls, storage ops).
- When behaviour conflicts with a comment, mark `⚠️ behaviour-comment conflict`
  and **auto-add it to the human-review list**.

Source classification + confidence per `analysis-conventions` §8.

Conflict format:
```markdown
| Rule ID | Code behaviour | Comment says | Conflict | Recommendation |
|---------|----------------|--------------|----------|----------------|
| PR-XXX | <actual logic> | <comment> | ⚠️ behaviour-comment conflict | trust code; confirm if comment is stale |
```

## Analysis steps
- **Step 1 — Structure**: review the target class's methods and purposes;
  identify the operation pattern per entry-point type (UI action / service
  transactional method / batch reader-processor-writer / REST-WS endpoint); map
  data interactions; record control/decision logic.
- **Step 2 — Rule layering**:
  | Layer | Description | In document? |
  |-------|-------------|--------------|
  | Core business rule | directly affects business correctness | ✅ with Given-When-Then |
  | Validation rule | input quality | ✅ brief |
  | Data-consistency rule | integrity, transaction boundary, rollback | ✅ annotate risk |
  | Implementation detail | technical only, no business meaning | ❌ leave in FUNCTION-LIST |
- **Step 3 — Rule identification**: validation, processing/calculation/
  conversion, control-flow, error-handling, data-access, transaction, security
  rules.
- **Step 4 — Extraction (business language)**: for each rule answer what / why
  (⚠️ mark if unconfirmable) / what-if-violated / relationships.

## Output format
- Rule catalog with stable IDs (e.g. `CR-01` core, `VR-01` validation,
  `DR-01` data-consistency). For each: statement (business language), why,
  violation handling, related rules, **inference source + confidence**.
- Given-When-Then blocks for core rules (concrete enough for QA).
- Behaviour-comment conflict table (if any).

### Items needing human review
Append the human-review section (`analysis-conventions` §11); all conflicts and
unconfirmable "why"s go here. Focus on: business source of rules, regulatory
constraints, semantic meaning of codes.

## Self-check
- [ ] Rules expressed in business language, not code.
- [ ] Core rules have Given-When-Then.
- [ ] Each rule has why / violation / relationships.
- [ ] Every rule carries an inference source + confidence.
- [ ] Behaviour-comment conflicts flagged and listed for review.
- [ ] Implementation-only details excluded.
- [ ] Derived after flow confirmation, not from assumptions.
