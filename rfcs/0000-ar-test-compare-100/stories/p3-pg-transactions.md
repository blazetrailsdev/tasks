---
title: "P3 — PG transaction error types (10 skips)"
status: draft
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/postgresql/transaction_test.rb` and
`test/cases/adapters/postgresql/transaction_nested_test.rb`.

**postgresql/transaction.test.ts (6):** verifies that the PG adapter surfaces specific
error classes — `SerializationFailure`, `QueryCanceled` (statement timeout),
`QueryCanceled` (user-cancel interrupt), `Deadlocked`, and `LockWaitTimeout` — by mapping
PostgreSQL SQLSTATE codes to ActiveRecord exception types.

**postgresql/transaction-nested.test.ts (4):** same error-type mapping inside nested
`SavepointTransaction` — `SerializationFailure` raised and recoverable, `Deadlocked`
raised and recoverable.

All 10 are standard Rails-mirrored tests with no threading requirement; the gap is in
PG SQLSTATE → ActiveRecord exception mapping in the connection adapter.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=postgresql PG_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 6 skips in `postgresql/transaction.test.ts` un-skipped and passing.
- [ ] All 4 skips in `postgresql/transaction-nested.test.ts` un-skipped and passing.
- [ ] No regressions in the broader PG adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`
(`translate_exception` — maps PG error codes `40001`, `57014`, `40P01`, `55P03`, etc. to
`ActiveRecord::SerializationFailure`, `QueryCanceled`, `Deadlocked`, `LockWaitTimeout`).
The "interrupt" cancel test requires sending `pg_cancel_backend` from a second connection
while the first is executing — achievable with two adapter instances and `Promise.race`.
