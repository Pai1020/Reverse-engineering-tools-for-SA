# Handoff: init → e2e

> Run: <run_id> · Feature: <feature> · Written: <ISO-8601 timestamp>

## What you need to read
- FLOWCHART.md and BUSINESS-RULES.md: <doc_root>/
- UI page/template: <full page path> (UI entry points only)
- VARIABLE-LIST.md (for sample field values): <doc_root>/

## Key assumptions
- module: <module>
- entry_point: <full page path or class name>
- entry_type: <ui | ws-api | rest-api | batch | cli>
- Skip when entry_type != ui (write a brief N/A handoff and report skipped).

## Items to confirm (⚠️)
- UI verification mode: Mock (default) unless profile §8 enables live mode.

## Confidence
- <high | medium | low>
