---
name: sa-api
description: Layer 4b System Analysis for WS/API entry points. Produces SA.md for integration developers/maintainers/QA — service capability, interface summary (full spec lives in API-CONTRACT.md), data-flow diagram, Given-When-Then behaviour, side effects. Use instead of sa for SOAP/REST endpoints.
---

# System Analysis (SA — WS/API, Layer 4b)

Produces `SA.md` for a WS/API target `<FUNCTION_NAME>`. Audience: **external
integration developers, maintainers, QA**.

> **Read the profile card** for the API module location and output path;
> auto-detect if absent. **Load skill `analysis-conventions`.** Required inputs:
> SD.md, FLOWCHART.md, BUSINESS-RULES.md, API-CONTRACT.md (must exist first);
> auxiliary: VARIABLE-LIST.md, FUNCTION-LIST.md.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/SA.md`.

## Core principle
Answer: what capability the service offers (endpoint list + purpose); how to call
it (interface **summary** — full spec in API-CONTRACT.md); how it is processed
internally and which systems it traverses (data-flow diagram); when it
succeeds/fails (Given-When-Then per endpoint); what side effects it causes
(storage writes, external calls, files produced).

- ✅ §2 interface contract is a concise summary (key business fields + return
  codes per API; full field defs point to API-CONTRACT.md); ASCII sequence
  diagram for data flow showing systems traversed; Given-When-Then grouped per
  endpoint; explicit side-effects per API; business-rule summary from
  BUSINESS-RULES.md annotated per endpoint.
- ❌ Do not fully expand all Request/Response fields here (that is API-CONTRACT.md);
  no vague preconditions.

## Analysis logic
- **Step 1 — from SD**: overall structure → §1 service overview; endpoint list +
  caller systems → §1 endpoint list; external integration → §3 data-flow diagram.
- **Step 2 — from API-CONTRACT**: key business fields per API → §2 interface
  summary; return-code table → §2 return-code summary.
- **Step 3 — from BUSINESS-RULES / FLOWCHART**: rules + flows → §4 Given-When-Then
  per endpoint; side effects → §5.

## Output structure
- **§1 Service overview + endpoint list**.
- **§2 Interface summary** (key fields + return codes; link to API-CONTRACT.md).
- **§3 Data-flow diagram** (ASCII sequence, systems traversed).
- **§4 Behaviour specs** — Given-When-Then per endpoint.
- **§5 Side effects** per API (storage writes, external calls, files).

### Items needing human review
Append the human-review section (`analysis-conventions` §11).

## Self-check
- [ ] §2 is a summary only; full contract deferred to API-CONTRACT.md.
- [ ] Data-flow diagram shows every system traversed.
- [ ] Given-When-Then grouped per endpoint, QA-ready.
- [ ] Side effects listed per API.
- [ ] Every statement traces to code; no vague preconditions.
