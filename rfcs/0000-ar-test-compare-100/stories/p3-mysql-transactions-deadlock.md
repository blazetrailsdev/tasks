---
title: "P3 — MySQL transactions, deadlock, lock-row delete (5 skips)"
status: draft
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 100
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/abstract_mysql_adapter/transaction_test.rb`,
`test/cases/adapters/abstract_mysql_adapter/nested_deadlock_test.rb`, and
`test/cases/adapters/abstract_mysql_adapter/count_deleted_rows_with_lock_test.rb`.

**abstract-mysql-adapter/transaction.test.ts (2):** `raises StatementTimeout when statement
timeout exceeded` and `reconnect preserves isolation level` — error-type propagation from
the MySQL adapter.

**abstract-mysql-adapter/nested-deadlock.test.ts (2):** `deadlock correctly raises Deadlocked
inside nested SavepointTransaction` and `rollback exception is swallowed after a rollback`.

**abstract-mysql-adapter/count-deleted-rows-with-lock.test.ts (1):** `delete and create in
different threads synchronize correctly`.

The transaction and deadlock tests are standard Rails-mirrored tests (no threading); the
gap is in exception mapping and savepoint rollback handling in the MySQL adapter. The
lock-row-delete test uses Ruby threads for synchronization.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=mysql2 MYSQL_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] Both skips in `abstract-mysql-adapter/transaction.test.ts` un-skipped and passing.
- [ ] Both skips in `abstract-mysql-adapter/nested-deadlock.test.ts` un-skipped and passing.
- [ ] The 1 skip in `abstract-mysql-adapter/count-deleted-rows-with-lock.test.ts` either
      un-skipped and passing, or reclassified into `unported-files` with reason `thread-sync`
      if the test relies on Ruby-threading semantics not reproducible in Node.js.
- [ ] No regressions in the broader MySQL adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

The `count-deleted-rows-with-lock` test ("delete and create in different threads synchronize
correctly") uses Ruby threads to race two DB connections. In Node.js the equivalent would
require `worker_threads` or multiple concurrent async operations; assess whether the
semantics can be expressed with `Promise.all` racing two adapter connections, or reclassify
as JS-impossible and add to `unported-files.ts` with reason `thread-sync`.

Rails source: `abstract_mysql_adapter.rb` (exception mapping),
`activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb`
(savepoint handling).
