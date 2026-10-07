---
title: "NullPool#disconnect and #inspect have no Rails counterpart"
status: draft
updated: 2026-10-07
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::ConnectionAdapters::NullPool`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-48`)
defines `server_version`, `schema_reflection`, `schema_cache`,
`connection_descriptor`, `checkin`, `remove`, `async_executor`, `db_config` and
`dirties_query_cache`. It has no `disconnect` and no `inspect`.

trails' `NullPool` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`)
still defines `disconnect(): void {}` and an `inspect()` that renders
`@server_version`. The invented `checkout` beside them was deleted with one
caller found, a test (`migration.test.ts`, "create table with force true does
not drop nonexisting table"), which now narrows the pool to `ConnectionPool`.
That test calls `pool.checkout()` where Rails'
`test/cases/migration_test.rb:229-232` calls `Person.lease_connection.dup`.

## Acceptance criteria

- [ ] `NullPool#disconnect` is deleted, or its caller is named with `file:line`
      and converged onto what Rails calls there.
- [ ] `NullPool#inspect` is deleted or shown to mirror a Rails definition.
- [ ] The migration test takes its second connection the way
      `migration_test.rb:232` does.
