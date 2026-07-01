---
name: batch-analysis
description: Structural analysis of a batch job (steps, step types, job-chain links, scheduling, status management, chunk data flow). Use when the analysis entry point is a batch job — runs before Layer 1 and feeds DEPENDENCIES.md (Batch structure) and FLOWCHART.md (Step flow).
---

# Batch Job Structure Analysis

When the entry point is a batch job, this preliminary step parses the job's full
structure. Its output embeds into `DEPENDENCIES.md` (§ Batch structure) and
`FLOWCHART.md` (§ Step flow).

> **Read the profile card** for where batch jobs live (module/layer map §3) and
> any scheduling reference it names. **Load skill `analysis-conventions`.** This
> skill is framework-agnostic in intent; the examples below assume a
> step/tasklet/chunk job engine — adapt to the project's batch framework.

## Inputs
- Entry point: a job id / job name.
- Scheduling reference: whatever the profile card points to (a schedule doc, a
  scheduler config, cron definitions) — or auto-detect from config files.

## Steps
1. **Locate the job definition**: search for the job id in batch config/source;
   confirm the definition exists; record its file path.
2. **Parse job structure**: job id; step list + chaining order; step types; job
   parameters.
3. **Identify step types**:
   | Type | Signal | Focus |
   |------|--------|-------|
   | Tasklet (method-invoking) | adapter invoking a target object/method | trace the target method |
   | Tasklet (custom) | a custom tasklet class | trace its execute() |
   | Chunk | reader / processor / writer + commit interval | trace reader query, processor logic, writer target |
   | Dynamic launch | tasklet launches another job (e.g. HTTP POST) | trace the launch call |
4. **Job-chain analysis**: find next-step constants / launch calls; record
   `Job A → step N → triggers Job B`; capture the full chain (A→B→C).
5. **Scheduling**: from the profile's scheduling reference, extract trigger type
   (manual / automatic / timed / after-core-batch / job-chain), cycle, time,
   scheduler folder/job name, monitoring rules, prerequisite batches.
6. **Status management**: whether a status/proc table records job state; identify
   status codes (e.g. processing / complete / error) and when they are set; any
   UI condition driven by status.
7. **Chunk data flow**: for chunk steps — reader (query: source, where, paging),
   processor (transform/filter/calc), writer (target, op, commit interval).

## Output format
- **§ Batch job structure** (into DEPENDENCIES.md): basics table (job id, def
  location, MAIN/SUB/standalone, trigger, schedule, monitoring); step structure
  table; job-chain diagram; status-management table.
- **§ Batch step flow** (into FLOWCHART.md): a mermaid flowchart of the steps
  with failure branch and job-chain trigger.

## Self-check
- [ ] Job definition found and id confirmed.
- [ ] All steps identified (with chaining order).
- [ ] Each step's type classified (tasklet / chunk / dynamic launch).
- [ ] Tasklet target object/method traced; chunk reader/processor/writer traced.
- [ ] Job chain fully traced (incl. next-step constants).
- [ ] Scheduling confirmed from the profile's reference.
- [ ] Status management recorded.
- [ ] Dynamically launched sub-jobs identified; prerequisite batches recorded.

## Common pitfalls
- Job id naming inconsistency (dots vs dashes).
- Dynamically launched sub-jobs are not in the step `next` chain — trace tasklet code.
- Steps sharing one job definition but branching by job parameters.
- A job marked "manual" may actually be triggered by a job chain.
- Chunk commit interval affects transaction boundaries (commit every N records).
