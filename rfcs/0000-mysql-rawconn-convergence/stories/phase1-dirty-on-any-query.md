---
title: "Phase 1 — mysql2 dirties the current transaction on any materialized query"
status: in-progress
updated: 2026-06-09
rfc: "0000-mysql-rawconn-convergence"
cluster: mysql-rawconn-convergence
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: 3067
claim: "2026-06-09T20:13:46Z"
assignee: "phase1-dirty-on-any-query"
blocked-by: null
---

## Context

The focused #3052 fix, shippable independently of the full convergence (Phase 2).
`Mysql2Adapter.execQuery` (`mysql2-adapter.ts:513`) calls
`dirtyCurrentTransaction()` **only in its DML branch** (`:569`, where the driver
returns a `ResultSetHeader`). The SELECT branch (rows array) never dirties the
transaction. Rails dirties on **any** materialized query —
`with_raw_connection` runs `dirty_current_transaction if materialize_transactions`
(`abstract_adapter.rb`).

Consequence: a `SELECT` inside an outer transaction leaves it non-dirty, so a
nested `requiresNew` becomes a `RestartParentTransaction` instead of a
`SavepointTransaction`, unlike Rails. The #3052 nested-deadlock test worked around
this by dirtying the parent with a 0-row DML where Rails uses `Sample.take` (a
SELECT).

See this RFC's §Design (Phase 1) and §Verification.

## Acceptance criteria

- A materialized `execQuery` dirties the current transaction on **both** branches
  (SELECT and DML), at the post-`materializeTransactions()` point that covers
  every materialized query — matching Rails'
  `dirty_current_transaction if materialize_transactions`. Non-materialized /
  schema queries still do not dirty.
- The #3052 nested-deadlock test reverts its 0-row-DML parent-dirtying workaround
  to a `Sample.take`-equivalent SELECT, matching `transactions_test.rb`.
- A test asserts: a SELECT inside an outer transaction makes a subsequent nested
  `requiresNew` open a `SavepointTransaction` (not a `RestartParentTransaction`).
- `pnpm tsc --build` clean; a **broad mysql2 adapter run** (transactions,
  deadlock, locking, nested) passes before/after — this changes nested-transaction
  shape, so it is not a drive-by.

## Notes

Run one mysql2 file at a time against a fresh `mysql:8` container (shared 13306 DB
accumulates leftover tables — the `1_need_quoting` `loadSchema` race). If Phase 2
lands first, `withRawConnection` will own dirty-on-materialized-query and this
story is subsumed — ship this first so the savepoint-shape change is isolated and
bisectable.
