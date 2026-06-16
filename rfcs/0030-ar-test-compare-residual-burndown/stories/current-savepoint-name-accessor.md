---
title: "expose current_savepoint_name / Transaction#savepoint_name"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`current_savepoint_name` / `current_transaction.savepoint_name` are not exposed.
The adapter has no `currentSavepointName()` method, and only
`SavepointTransaction` carries `savepointName`
(packages/activerecord/src/connection-adapters/abstract/transaction.ts:737) —
`RealTransaction` / `NullTransaction` return `undefined` rather than `null`.

Blocks un-skipping `savepoints name` (transactions.test.ts), which asserts
`active_record_1` / `active_record_2` nesting (rails transactions_test.rb:1048).

## Acceptance criteria

- [ ] Adapter `currentSavepointName()` returns `current_transaction.savepoint_name`.
- [ ] `savepointName` returns `null` on Real/Null transactions, the savepoint id
      on SavepointTransaction.
- [ ] `savepoints name` un-skipped and passes; no new gate-mismatches.
