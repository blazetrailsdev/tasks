---
title: "fixtures() drops its default leaseConnection getter once its 27 dependents lease per test"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: 4
pr: trails#8054
claim: "2026-09-24T21:46:41Z"
assignee: "fixtures-default-lease-getter-retires-with-its-dependents"
blocked-by: null
closed-reason: null
---

## Context

`fixtures()` (`packages/activerecord/src/test-fixtures.ts`) registers
`connection ?? (() => Base.leaseConnection())` as its default adapter getter,
so every test resolves a lease before it runs. Rails has no adapter getter:
`setup_transactional_fixtures` walks
`connection_handler.connection_pool_list(:writing)`
(`activerecord/lib/active_record/test_fixtures.rb:170-212`). A test body that
wants a connection leases it in `setup`
(`@connection = ActiveRecord::Base.lease_connection`).

`adapter-test-leases-connection-as-rails-does` converged `adapter.test.ts` and
`CompositePrimaryKeyTest`. It then removed the default and ran every file that
calls `fixtures()` with a non-transactional test and reads `.connection`, on
sqlite3. These 27 files still depend on the default. They raised 81 x
``Called deprecated `ActiveRecord::Base.connection` method`` without it, and
all pass with it:

active-record-schema, adapters/sqlite3/virtual-column, cache-key,
connection-adapters/abstract/schema-statements-assume-migrated-upto-version-pool.trails,
connection-adapters/sqlite3/quoting.trails, date-time-precision, defaults,
dirty, locking, migration-context.trails, migration, migration.trails,
migrator, migrator.trails, persistence, primary-keys (the other describes),
query-cache, reserved-word, schema-dumper, schema-dumper.trails,
statement-invalid, time-precision, timestamp, transaction-instrumentation,
transactions, transactions.trails, validations/uniqueness-validation
(all `packages/activerecord/src/*.test.ts`).

`test-bodies-lease-connection-per-test` owns four of them: reserved-word,
schema-dumper, migration and primary-keys.

## Acceptance criteria

- Each listed file leases per test as its Rails counterpart does
  (`beforeEach(async () => { connection = await Base.leaseConnection(); })`).
- `fixtures()` then drops the default getter:
  `registerFixtureHooks(klass, connection)`. Before landing, re-run the files
  above with the default removed to confirm nothing still depends on it.
