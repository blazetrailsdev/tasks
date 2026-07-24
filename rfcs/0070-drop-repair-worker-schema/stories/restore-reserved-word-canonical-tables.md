---
title: "Restore canonical reserved-word tables after reserved-word.test.ts"
status: draft
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Top drift source in the Phase-1 measurement (3 of 12 firings; sqlite, postgres,
mysql). `packages/activerecord/src/reserved-word.test.ts:65-98` takes the
canonical reserved-word tables — `group`, `select`, `distinct`,
`distinct_select`, `values`, `order` (all declared in
`packages/activerecord/src/test-helpers/test-schema.ts:1745,1751` etc.) — drops
them (`:72`), recreates bespoke shapes (`:73-84`), and in `afterAll` drops them
again (`:98`) **without restoring the canonical shape**. Every later file in the
same worker that reads one of these canonical tables then trips
`repairWorkerSchema` (`test-setup-dy.ts:69`), observed at victims
`left-outer-join-association.test.ts`, `disable-joins-association-scope.test.ts`,
`establish-connection.test.ts`.

## Acceptance criteria

- After `reserved-word.test.ts` finishes, `group`/`select`/`distinct`/
  `distinct_select`/`values`/`order` are back in their canonical `TEST_SCHEMA`
  shape (restore in `afterAll` via `rebuildCanonicalTables`, or run the suite
  against transactional fixtures / its own scratch tables so canonical shape is
  never mutated).
- A re-measured CI run (the Phase-1 `AR_REPAIR_COUNT_DIR` instrumentation, or a
  local reproduction) shows **zero** repair firings attributable to this table
  set across all three backends.
- Rails-faithful: mirror `vendor/rails/activerecord/test/cases/reserved_word_test.rb`
  teardown; no test renamed. `test:compare` delta >= 0.
