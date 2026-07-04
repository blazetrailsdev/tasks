---
title: "Gate repairWorkerSchema DROP+CREATE behind real drift detection"
status: claimed
updated: 2026-07-04
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: ["truncate-based-global-reset"]
deps-rfc: []
est-loc: 150
priority: 2
pr: null
claim: "2026-07-04T13:19:26Z"
assignee: "gate-repairworkerschema-drops-behind-drift"
blocked-by: null
closed-reason: null
---

## Context

Follow-on to `truncate-based-global-reset`. `repairWorkerSchema`
(`packages/activerecord/src/test-helpers/schema-repair.ts`, called from
`test-setup-dy.ts` and ~5 relation/\*.test.ts files) detects shape drift on a
shared worker DB and **drops + recreates** drifted tables to restore the
canonical shape (the RFC 3351 systemic fix for shared-DB shape-drift, per
`MEMORY.md`). On a boot-laid, shape-stable schema where the reset no longer drops
tables, shape drift should be impossible for canonical tables — so the repair's
DROP+CREATE path should almost never fire, but currently may still run
speculatively and contribute to the measured DROP churn.

## Acceptance criteria

- Audit `repairWorkerSchema`'s DROP+CREATE contribution under the truncation
  reset (via `DDL_PROFILE=1`). Gate the drop-and-recreate path behind an actual
  drift check so it is a no-op when the canonical boot shape is intact, rather
  than a routine reaper.
- `repairWorkerSchema` still correctly repairs a genuinely drifted **bespoke**
  table (its original safety purpose) — verified by its
  `schema-repair.test.ts`. No behavior change for real drift; only the redundant
  routine drops removed.
- `test:compare` delta ≥ 0; all 3 lanes green; shared-DB flake set stays green.
