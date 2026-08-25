---
title: "schemaConn is a trails-only stand-in for Rails' lease_connection in DDL-rendering tests"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6217
claim: "2026-08-08T02:06:08Z"
assignee: "retire-schemaconn-for-a-leased-connection"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/schema-conn.ts` is a trails invention with
no Rails counterpart. Rails' own DDL-rendering tests hand `SchemaCreation.new`
and `TableDefinition#initialize` an `ActiveRecord::Base.lease_connection`
(e.g. `vendor/rails/activerecord/test/cases/adapter_test.rb`,
`test/cases/migration/columns_test.rb`); `schemaConn` instead memoizes one
adapter per dialect so a lane can render DDL for a dialect it isn't running.

PR #6212 (`schema-conn-adapters-carry-a-real-pool`) closed the acceptance
criteria's first arm — the adapters now come out of a real
`PoolConfig`/`ConnectionPool` through `ConnectionPool#new_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:1003-1007`),
so `role` / `shard` / `inspect()` answer instead of reading the constructor's
`NullPool` seed (`abstract_adapter.rb:153`). The helper's _existence_ is the
second arm the story offered ("or the helper is retired in favour of a leased
connection") and it was left standing.

Two facts bound the work:

- It lives in `src/support/**`, which is outside **both** the `parity:api` and
  `parity:test` populations, so nothing measures it. That is why an invented
  helper has survived here — see the standing note on that seam.
- ~90 call sites across 14 test files consume it
  (`connection-adapters/abstract/schema-{creation,definitions}*.test.ts`,
  `connection-adapters/{sqlite3,postgresql,mysql}/schema-*.test.ts`,
  `abstract-mysql-adapter.test.ts`, `schema-cache.test.ts`, `adapter.test.ts`,
  `migration.test.ts`, `active-record-schema.test.ts`), so this is a sweep, not
  a two-line deletion.

## Converged shape

The cross-dialect DDL-rendering assertions are the reason the helper exists: a
sqlite lane cannot `lease_connection` a PostgreSQL adapter. Two arms, and the
story should establish which before sweeping:

1. **Retire it.** Move each dialect's DDL-rendering assertions behind the
   adapter gate its Rails counterpart uses (`current_adapter?`), so every
   surviving assertion runs against a real `lease_connection` on the lane that
   owns that dialect. Closest to Rails; loses cross-dialect coverage on the
   other lanes, which is coverage Rails does not have either.
2. **Keep it, at the Rails name.** If the cross-dialect rendering is worth
   keeping, the helper is still trails-only surface and should say so with a
   `@noRailsEquivalent` receipt naming the Rails tests it stands in for.

Arm 1 is the convergence; arm 2 is the fallback that must be justified, not
assumed.

## Acceptance criteria

- [ ] Either `schemaConn` is gone and its consumers lease a real connection
      under the correct adapter gate, or it carries a reviewed
      `@noRailsEquivalent` with the Rails test it substitutes for.
- [ ] No test renamed; the DDL-rendering tests stay green on sqlite (file
      lane), `sqlite3_mem`, PG and MariaDB.
- [ ] `pnpm parity:test` delta non-negative.
