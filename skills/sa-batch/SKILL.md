---
name: sa-batch
description: Layer 4b System Analysis for batch jobs (no UI entry point). Produces SA.md for operations/PM/QA — what the batch does, when/how it is triggered, what it produces, failure handling, Given-When-Then behaviour. Use instead of sa for pure scheduled/automatic batch jobs.
---

# System Analysis (SA — Batch, Layer 4b)

Produces `SA.md` for a batch-job target `<FUNCTION_NAME>`/job id. Audience:
**operations staff, PM, QA**.

> **Read the profile card** for the batch module location, scheduling reference
> and output path; auto-detect if absent. **Load skill `analysis-conventions`.**
> Required inputs: SD.md, FLOWCHART.md, BUSINESS-RULES.md, the "Batch structure"
> section of DEPENDENCIES.md; auxiliary: VARIABLE-LIST.md, FUNCTION-LIST.md.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/SA.md`.

## Core principle
Answer in plain language: what the batch does; when it runs / how it is triggered
(schedule + prerequisites); what it produces (storage changes, files, status
updates); what to do on failure (rerun? catch-up? manual intervention? data
repair?); when it succeeds/fails (Given-When-Then).

- ✅ Conversational, from the scheduling angle (when it runs → what data it
  processes → what it produces); explicit failure handling; Given-When-Then
  QA-ready.
- ❌ No technical jargon (mapper, transaction, propagation); no code-level detail.

## Output structure
Header: job id, analysis date, batch name, trigger type (scheduled / manual /
job-chain / event), related SD.md.
- **§1 Batch overview** (business language).
- **§2 Trigger & schedule**: when it runs, prerequisites, trigger mechanism
  (from the profile's scheduling reference).
- **§3 Processing flow** (plain-language step walkthrough).
- **§4 Outputs**: storage changes, files produced, status updates.
- **§5 Failure handling**: rerun strategy, manual intervention, data repair.
- **§6 Behaviour specs** — Given-When-Then incl. failure scenarios.

### Items needing human review
Append the human-review section (`analysis-conventions` §11). Focus on: real
schedule times, monitoring rules, failure-recovery procedures.

## Self-check
- [ ] Trigger type + schedule + prerequisites stated (from profile reference).
- [ ] Outputs (storage/files/status) listed.
- [ ] Failure handling explicit (rerun / catch-up / manual / repair).
- [ ] Given-When-Then incl. failure scenarios, QA-ready.
- [ ] No jargon; every statement traces to code.
