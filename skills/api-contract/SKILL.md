---
name: api-contract
description: Layer 4b (WS/API entry points only). Produces the interface contract for SOAP/REST endpoints — full Request/Response field definitions (including inherited fields), validation rules, return codes — for external integration developers. Produces API-CONTRACT.md.
---

# API Contract (Layer 4b, WS/API only)

Produces `API-CONTRACT.md` for a target endpoint class/`<FUNCTION_NAME>`.
Audience: **external integration developers**. Applies only to web-service / REST
entry points.

> **Read the profile card** for the API module location and output path;
> auto-detect if absent. **Load skill `analysis-conventions`.** Inputs: the
> endpoint source (with Request/Response inner classes) and their base classes;
> auxiliary: SD.md, VARIABLE-LIST.md.

Output: per profile §7, default `<docs_root>/.../<FUNCTION_NAME>/API-CONTRACT.md`.

## Core principle
Answer: how to call (full Request fields per API); what to send (type, required,
validation per field); what comes back (full Response fields); what each code
means (return-code table).

- ✅ Each API self-contained: list **all** fields including inherited ones, so a
  reader understands one API without cross-referencing.
- ✅ Every field: type, required flag, validation rule, description.
- ✅ Complete return-code table (all codes + trigger conditions).
- ✅ Expand sub-fields of nested objects / list items.
- ❌ No "same as above" shortcuts; no separate shared-fields section to reassemble;
  do not omit inherited fields.

## Analysis logic
1. **Identify endpoints**: from endpoint annotations (`@WebMethod` /
   `@RequestMapping`/route definitions); record method name + purpose.
2. **Request inheritance chain**: find each endpoint's request class; walk up to
   base request / header; list all fields (incl. inherited).
3. **Response inheritance chain**: same for response; expand nested objects/lists.
4. **Validation rules**: extract per-field rules from validation methods; note
   which fields are required per endpoint (may differ across endpoints).
5. **Return codes**: from success/error handlers and catch blocks; map exception
   types → return codes; trace business error codes.

## Output structure
Header: class name, analysis date, type, related SA.md.
- **§1 Endpoint overview** table: #, endpoint, direction (inbound/outbound),
  protocol, request class, response class, purpose.
- **Per endpoint**: full Request field table, full Response field table
  (incl. inherited + nested), validation rules, return-code table.

### Items needing human review
Append the human-review section (`analysis-conventions` §11). Focus on: real
endpoint addresses/SLA, auth mechanism, ambiguous required-field semantics.

## Self-check
- [ ] All endpoints identified.
- [ ] Request/Response fields complete incl. inherited and nested.
- [ ] Each field has type / required / validation / description.
- [ ] Return-code table complete with trigger conditions.
- [ ] No "same as above"; each API self-contained.
- [ ] Every field/code traces to real source.
