---
title: "F-9c — adapter_test exception translation + referential integrity (MySQL/PG)"
status: in-progress
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 170
priority: 20
pr: 3177
claim: "2026-06-13T02:19:09Z"
assignee: "f9c-adapter-exception-translation-refint"
blocked-by: null
---

## Context

Residue from F-9a (#3150). Backend-gated (`describeIfMysql`/`describeIfPg`),
CI-gated via the ARCONN-keyed adapter lanes (RFC 0012 lane is wired). Skipped
`adapter.test.ts` entries:

- `value limit violations are translated to specific exception` (non-SQLite; Event model, limited title)
- `numeric value out of ranges are translated to specific exception` (RangeError on out-of-range bigint)
- `disable referential integrity` (fk_test_has_pk/has_fk tables)
- `foreign key violations are translated to specific exception with validate false`
- `foreign key violations on insert are translated to specific exception`
- `foreign key violations on delete are translated to specific exception`
- `invalidates transaction on rollback error` (InvalidateTransactionTest) — MySQL-only:
  `invalidateTransaction` fires only when `isSavepointErrorsInvalidateTransactions()`
  is true (mysql2-adapter override; false on abstract/sqlite/pg), matching Rails
  `savepoint_errors_invalidate_transactions?`.

## Acceptance criteria

- [ ] Listed tests pass under MySQL/PG gating; SQLite remains correctly skipped.
- [ ] `test:compare --cached --package activerecord` delta non-negative.
