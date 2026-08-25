---
title: "retire-non-transactional-ratchet-non-wrappable-classes"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6125
claim: "2026-08-05T12:29:59Z"
assignee: "retire-non-transactional-ratchet-non-wrappable-classes"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to the first slice of `burn-down-non-transactional-row-write-ratchet`
(PR that converged `encryption/encryptable-record-api.test.ts` and
`support/handler-resolved-adapter.test.ts`, 44 → 42 rows).

That PR triaged all 44 rows in `scripts/non-transactional-row-writes.json`
against the "does this file actually leak rows on a shared connection?"
question. The remaining 42 fall into three classes, and only the first is
wrap-convergeable:

1. **Shared-connection writers** — reach the canonical per-worker connection
   via `Base.connection` / `leaseConnection` / `ambientConnection` /
   `freshAdapter`, so rows genuinely outlive the test. Both files the first
   slice converged were in this class. What is left of it either drops its
   own tables in `afterEach` (`invertible-migration.test.ts` drops `horses` /
   `new_horses`; `migration/columns.test.ts` and `migration/rename-table.test.ts`
   `createTable(force: true)` in `beforeEach` and `dropTable` in `afterEach` —
   which is what Rails' `Migration::TestHelper` does too,
   vendor/rails/activerecord/test/cases/migration/helper.rb:20-34) or exists to
   drop tables (`support/drop-all-tables.test.ts`).

2. **Throwaway per-test adapters** — the whole `adapters/*` cluster (24 files)
   plus `connection-adapters/connection-handlers-sharding-db.test.ts`
   constructs a brand-new adapter in `beforeEach`
   (`new BetterSQLite3Adapter(":memory:")`, `new PostgreSQLAdapter(PG_TEST_URL)`
   - `DROP TABLE IF EXISTS`/`CREATE TABLE` per test) and closes it in
     `afterEach`. Rows cannot survive the adapter. A transactional wrap here
     would add a `BEGIN`/`ROLLBACK` around a database that is discarded anyway.

3. **Detector false positives** — the `WRITE_PATTERNS` scan is deliberately
   textual, and matches non-row-writing calls: `AliasTracker.create`,
   `SchemaDumper.create`, `Object.create`, `DatabaseTasks.create(config)`,
   `new SQLiteDatabaseTasks(config).create()`, a GCM cipher's `.update(...)`,
   `Serialized#isChanged` object literals, and the `it(`-scope tracker
   attributing a write to a `});` or comment line. Nine-ish rows are pure
   false positives (`associations/alias-tracker.test.ts`,
   `type/serialized.trails.test.ts`, `unconnected.test.ts`,
   `tasks/database-tasks-banners.trails.test.ts`,
   `tasks/sqlite-database-tasks.test.ts`, `encryption/cipher/aes256-gcm.test.ts`,
   `connection-adapters/abstract-mysql-adapter.test.ts`,
   `connection-adapters/abstract/schema-dumper.test.ts`,
   `connection-adapters/postgresql/schema-dumper.test.ts`,
   `connection-adapters/mysql/schema-statements.test.ts`,
   `connection-adapters/raw-connection-overload.test.ts`).
   `support/setup-adapter-suite.test.ts` is a fourth shape: it IS transactional,
   via `setupAdapterSuite`, which the per-file textual `hasTransactionalWiring`
   check cannot see.

The parent story's acceptance criterion "no file is removed from the ratchet
without a corresponding wrap" is what keeps classes 2 and 3 pinned: they cannot
be converged by wrapping, because wrapping is not what they are missing.

## Acceptance criteria

- [ ] Decide, with the user/RFC owner, how classes 2 and 3 retire: either the
      detector gains the precision to stop reporting them (per-call-target
      recognition of `.create(` on a non-Model receiver; treating a file whose
      adapter is constructed and closed per test as self-cleaning; recognizing
      `setupAdapterSuite` as transactional wiring) or the ratchet's contract is
      restated so those rows are removable without a wrap.
- [ ] Whichever route, `scripts/non-transactional-row-writes.json` shrinks and
      `scripts/non-transactional-row-writes.ts`'s header documents the rule the
      remaining rows are held to.
- [ ] No file loses its row while it can still leak rows on a shared connection.
- [ ] Suites green on all three lanes.
