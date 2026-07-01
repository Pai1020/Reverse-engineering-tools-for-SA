---
name: sa
description: Layer 4b System Analysis (UI / general, non-WS/API). Produces SA.md for business/PM/QA readers in plain language — feature overview, screen specs, operation flow, output-generation process, Given-When-Then behaviour specs, with screenshots for UI entry points. For WS/API use sa-api; for pure batch use sa-batch.
---

# System Analysis (SA — UI / general, Layer 4b)

Produces `SA.md` for a target `<FUNCTION_NAME>`. Audience: **business units, PM,
QA** (not developers).

> **Read the profile card** for the module/layer map and output path; auto-detect
> if absent. **Load skill `analysis-conventions`** (SA tone §9, precise wording
> §7). Required inputs: SD.md (must exist first), FLOWCHART.md, BUSINESS-RULES.md;
> auxiliary: VARIABLE-LIST.md, FUNCTION-LIST.md, UI-VERIFY.md (screenshots).

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/SA.md`.

## Core principle
Answer in plain language: what does the feature do; what does the user see / do /
get; what did the system produce and how; what does the screen look like after;
what happens under which conditions (Given-When-Then).

- ✅ Conversational, from the screen-operation angle (user clicks X → system does
  Y → screen shows Z); explain how outputs are produced; describe the final screen
  state; Given-When-Then concrete enough for QA test cases; every statement traces
  to code; attach reasoning notes for non-intuitive conclusions; embed screenshots.
- ❌ No technical jargon (mapper, transaction, propagation); no code-level detail
  (class/method names); no vague preconditions (always state how a state is reached).

## Screenshot rule
For **UI entry points**, screenshots are **required** (not skippable) and come
from the `ui-verify` step (Mock mode by default — no live environment). Embed
under each screen-block heading (§2) and at key steps (§3) as
`![step](./images/NN-desc.png)`. Text descriptions must stand alone regardless.

## Analysis logic
- **Step 1 — from SD**: overall structure → §1 overview (business language);
  entry point + operation path → §2 operation flow; external integration → §3
  output-generation process.
- **Step 2 — from FLOWCHART**: user-operation flow → §2 step-by-step screen
  interaction; branching → alternate paths; error handling → §4 exception
  Given-When-Then.
- **Step 3 — from BUSINESS-RULES**: rules → §4 behaviour specs (Given-When-Then).
- **Step 4 — synthesis + (UI) screenshot embedding**.

## Output structure
- **§1 Feature overview** (business language).
- **§2 Screen specs + operation flow** (screen-by-screen; screenshots for UI).
- **§3 Output-generation process** (how PDFs/emails/records are produced).
- **§4 Behaviour specs** — Given-When-Then per scenario incl. exceptions.
- **Reasoning notes** for non-intuitive conclusions.

### Items needing human review
Append the human-review section (`analysis-conventions` §11).

## Self-check
- [ ] Written for business/PM/QA; no jargon or class/method names.
- [ ] Operation flow states how each state is reached (no vague preconditions).
- [ ] Given-When-Then concrete enough for QA.
- [ ] Output-generation process explained.
- [ ] UI entry points: screenshots embedded (or noted pending).
- [ ] Every statement traces to code; reasoning notes for non-intuitive ones.
