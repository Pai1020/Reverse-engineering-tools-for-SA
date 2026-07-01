---
name: analysis-conventions
description: Generic methodology shared by all code-analysis and verification skills/agents. Anti-hallucination rules, comment handling, speculation classification, precise wording, diagram conventions (mermaid/ASCII), and the human-review checklist format. Load this before producing any analysis document.
---

# Analysis Conventions (shared methodology)

> Applies to every analysis activity (all skills, agents, orchestrators) in this
> plugin. These rules are **project-agnostic** — they describe *how* to analyse,
> never *what* a specific project contains. Project-specific facts (paths, tech
> stack, table prefixes, constant classes, entry-point types) come from the
> project profile card `.analysis-profile.md` (see the `analysis-init` skill).

---

## 1. Anti-hallucination principles

1. **Every conclusion must trace to an actual line of code** — never assume
   "standard" behaviour.
2. **File paths must be confirmed to exist** — never guess file locations.
3. **Class / method names must match the source exactly** — never invent
   signatures.
4. **Table / collection names must be confirmed in the query/mapper layer** —
   include any schema prefix the project uses (see profile card).
5. **Constant values must be confirmed in the constant definition** — never
   assume code values.
6. **External system endpoints must be confirmed in client code or config.**
7. **Anything that cannot be confirmed is marked `⚠️ needs human review`** —
   prefer flagging uncertainty over fabricating.
8. **If a static-facts index exists for this repo** (`.analysis/index/<service>/facts.json`
   — see the `static-index` skill), symbol/endpoint/table existence claims
   must be checked against it first. A claim that contradicts `facts.json` is
   a hard error, not a low-confidence guess: stop and re-read the actual
   source line before writing anything. `facts.json` is silent on business
   logic/semantics by design — its absence there is not itself a gap.

## 2. Comment handling

- Treat all code comments as **speculation**, not fact (comments may be stale or
  wrong).
- Code behaviour is fact — if/else logic, method calls, DB operations are
  certain.
- When behaviour conflicts with a comment, flag it with ⚠️.

## 3. Human-review threshold

When an item cannot be confirmed, first try to find the answer in the code
(up to 3 attempts). Only after 3 failed attempts list it under the
"⚠️ Items needing human review" section.

## 4. Analysis focus

- **Ignore comments, focus on data flow** — concentrate on actual logic and how
  data is passed.
- **Avoid vague preconditions** — every described scenario must state *how that
  state is reached*: concrete page/screen names, operation steps, system
  responses.

## 5. Reasoning trail

- For Layer 3+ documents, every non-obvious conclusion must carry a reasoning
  note (source of inference, code location, confidence).
- For special control flows (independent/new transactions, cross transaction
  manager, conditional rollback, etc.) explain *how the behaviour was derived
  from the code*.

## 6. Flow-first principle

- Layer 3 (Flowchart) must confirm the real execution flow from code **before**
  deriving business rules. Never start from assumptions.
- When analysis reaches a related module, decide whether to go deeper per the
  dependency-analysis skill's trigger conditions (no depth limit, but annotate
  the level).

## 7. Precise wording

| Term | Precise meaning | Forbidden vague use |
|------|-----------------|---------------------|
| simultaneously / 同時 | executed sequentially within one operation (not parallel); user perceives one action | must not imply parallel execution |
| afterwards / 之後 | previous step completed (system responded), then user takes next step | must not be used for continuous processing of one button click |
| immediately / 立即 | completed within the response to one button click; no waiting / re-operation | must not be used for scheduled / batch scenarios |
| finally / 最終 | state after all processing done and data permanently persisted | must not be used for intermediate states |
| triggered / 觸發 | deferred or asynchronous execution driven by an event/condition | must not be used for a direct button-click response |
| automatically / 自動 | runs by itself per a condition, no user intervention | must not be used for operations needing user confirmation |

## 8. Speculation source classification

| Source type | Description | Confidence |
|-------------|-------------|-----------|
| Code logic | derived directly from if/else, switch, method calls | High |
| Variable naming | inferred from variable/method names | Medium |
| Code comments | inferred from `//` or `/* */` | Low (treat as speculation) |
| Constant naming | inferred from constant names | Medium |
| Context inference | inferred from call chains / data flow | Medium |
| Unconfirmable | cannot be derived from code at all | Very low (list for human review) |

---

## 9. Audience tone (for output documents)

### SA documents (readers: business units, PM, QA)
- ✅ Conversational, like explaining the feature to a colleague.
- ✅ From the screen-operation angle: user does X → system does Y → screen shows Z.
- ✅ Given-When-Then scenarios concrete enough for QA to write test cases.
- ❌ No technical jargon (mapper, transaction propagation, etc.).
- ❌ No code-level detail (class names, method signatures).

### SD documents (readers: developers)
- ✅ Keep technical detail (method decomposition, I/O specs, exception paths).
- ✅ Annotate the entry point location (full path UI → Service → data layer).
- ✅ Focus on the "why" of design decisions.
- ❌ Do not translate code line-by-line.
- ❌ Do not list every getter/setter call.

### API-CONTRACT documents (readers: external integration developers)
- ✅ Each API self-contained; list **all** fields (including inherited common fields).
- ✅ Every field has type, required flag, validation rule, description.
- ❌ No "same as above" / "see above" shortcuts.
- ❌ Do not omit fields inherited from a parent class.

---

## 10. Diagram conventions

### Primary format: mermaid

| Scenario | mermaid type | Notes |
|----------|--------------|-------|
| Main flow / branching | `flowchart TD` | diamond decisions, rectangle steps |
| Method-call sequence | `sequenceDiagram` | cross-system / cross-layer calls |
| State transitions | `stateDiagram-v2` | status machines |
| Transaction boundary | `flowchart TD` + subgraph | frame the Tx scope with subgraph |
| Batch step flow | `flowchart TD` | step chaining + failure branches |

### Fallback: ASCII

Use ASCII when mermaid cannot express clearly:
- complex nested transaction boundaries (multi-layer subgraph hard to read)
- data-flow diagrams (multi-column field mapping clearer as ASCII tables)
- precise side-by-side comparison
- layered architecture diagrams (multi-level nested component relations)

### mermaid authoring rules

1. **Node IDs** in English (e.g. `validate01`); display text may be any language.
2. **Decision nodes** use `{}` diamonds.
3. **Process nodes** use `[]` rectangles.
4. **Start/end** use `([])` rounded.
5. **subgraph titles** annotate transaction info (e.g. `subgraph Tx-A [NEW TX, dataSourceX]`).
6. **Risk annotation** add ⚠️ inside node text.
7. **External systems** use `[/ExternalName/]` parallelograms or annotate in participants.

### ASCII symbols

| Symbol | Use |
|--------|-----|
| `┌─┐│└─┘` | rectangle frames (steps, components) |
| `▼ → ←` | flow arrows |
| `├── └──` | tree structure |
| `⚠️` | risk annotation |
| `[Y] [N]` | conditional branches |
| `───────` | separator |

---

## 11. Human-review checklist format

Per §3, when AI cannot confirm a conclusion after 3 attempts, list it. Append
this section to the end of every analysis document:

```markdown
---

## ⚠️ Items needing human review

| # | Item | Speculation | Source | Confidence | Impact |
|---|------|-------------|--------|-----------|--------|
| 1 | (what needs confirming) | (current guess) | code comment / naming / context | low / med / high | which section/conclusion it affects |

> How to confirm: a domain expert reviews the "Speculation" column and fills in
> ✅ confirmed / ❌ corrected to "...". After confirmation, notify the AI to
> regenerate the affected sections.
```

Field definitions:

| Field | Meaning |
|-------|---------|
| # | running number |
| Item | the question to confirm |
| Speculation | the AI's current guess |
| Source | source type from §8 |
| Confidence | high / med / low per §8 |
| Impact | which sections change if corrected |

Confidence mapping (per §8):
- **High**: derived directly from if/else, switch, method calls.
- **Medium**: from variable/constant naming or context inference.
- **Low**: inferred from code comments (comments are speculation).

---

## 12. Output language

All produced analysis documents (DEPENDENCIES.md, VARIABLE-LIST.md, ERD.md,
FUNCTION-LIST.md, FLOWCHART.md, BUSINESS-RULES.md, UI-VERIFY.md, SD.md,
API-CONTRACT.md, SA.md, verify-report.md, SERVICE-MAP.md, and any future
rollup docs) are written primarily in **Traditional Chinese (繁體中文)**,
with English kept only for:

- Code identifiers quoted verbatim: class/method/field/variable names, file
  paths, table/column names.
- Framework/technical tokens without a stable Chinese equivalent: annotation
  names (`@RestController`), HTTP verbs (GET/POST), SQL keywords, protocol
  names.
- Mermaid node IDs (per §10 — display text inside nodes should still be
  Chinese; only the ID token stays English/ASCII since mermaid requires it).
- Content quoted verbatim from source (code comments, error/log messages,
  external API field names) — quote as-is, do not translate the quotation
  itself, but the surrounding explanation is still Chinese.
- Established acronyms with no idiomatic short Chinese form (e.g. API, SQL,
  JWT, ID) — use as-is inline rather than forcing an awkward translation.

Do not translate the structural markdown you're filling into a template
(section headers like "Given-When-Then" stay as the fixed term the skill
defines — see the skill's own Output format for which headers are fixed
vocabulary vs which are prose you write).

This rule applies regardless of the profile card's or source code's own
language — a codebase with English identifiers and comments still gets a
Traditional-Chinese analysis document; only the identifiers/comments
themselves stay in their original form when quoted.
