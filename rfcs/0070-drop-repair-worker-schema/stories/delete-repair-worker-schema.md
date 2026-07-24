---
title: "Delete repairWorkerSchema once CI proves zero firings"
status: draft
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps:
  [
    "restore-reserved-word-canonical-tables",
    "restore-habtm-courses-canonical-tables",
    "restore-children-canonical-table",
    "restore-fk-test-canonical-tables",
    "restore-camelcase-canonical-table",
    "restore-comment-habtm-canonical-tables",
    "restore-subscribers-canonical-table",
    "restore-items-canonical-table",
  ]
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Capstone for RFC drop-repair-worker-schema. Once the eight burndown stories land
and a re-measured CI run (the Phase-1 `AR_REPAIR_COUNT_DIR` instrumentation)
proves **zero** `repairWorkerSchema` firings across all AR backends, the
self-healing crutch and its measurement scaffolding can be deleted. Blocked on
all eight drift-source stories.

Targets:

- `packages/activerecord/src/test-helpers/schema-repair.ts` (delete)
- `packages/activerecord/src/test-helpers/schema-repair.test.ts` (delete)
- the `repairWorkerSchema` call block in
  `packages/activerecord/src/test-setup-dy.ts:67-` (delete, incl. the
  `AR_DISABLE_SCHEMA_REPAIR` / `AR_QUIET_SCHEMA_REPAIR` env plumbing)
- unblocks RFC 0028 `retry: 2` shared-DB flake-masking removal

## Acceptance criteria

- Prove zero firings first: a full-matrix CI run with the repair-count
  instrumentation (re-added temporarily or kept from Phase 1) reports 0 records
  on sqlite, postgres, and maria.
- Delete `schema-repair.ts`, `schema-repair.test.ts`, and the `test-setup-dy.ts`
  call site; no other test regresses (all 3 AR lanes green; shared-DB flake set
  green; `test:compare` delta >= 0).
- Remove any now-dead `AR_DISABLE_SCHEMA_REPAIR` / `AR_QUIET_SCHEMA_REPAIR`
  references. Note the RFC 0028 masking-removal follow-up in the PR body.
