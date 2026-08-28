---
title: "The frontiers SqlJsAdapter duck-types the ActiveRecord adapter/pool contract behind a cast"
status: draft
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The frontiers browser sandbox runs against `SqlJsAdapter`
(`packages/website/src/lib/frontiers/sql-js-adapter.ts`), which its own header
declares is "NOT an ActiveRecord adapter" — it duck-types the handful of
methods the website needs rather than extending `AbstractAdapter`.

PR #7161 (`frontiers-sql-js-adapter-has-no-connection-pool`) extended that
duck-typing rather than ending it: it added a `SqlJsConnectionPool` answering
the `@pool` surface `SchemaMigration` and `InternalMetadata` reach —
`@pool.with_connection` (`vendor/rails/activerecord/lib/active_record/schema_migration.rb:22-24`,
`internal_metadata.rb:41-45`), `@pool.db_config.use_metadata_table?`
(`internal_metadata.rb:35-36`) and `@pool.schema_cache`
(`internal_metadata.rb:108-110`) — plus `selectValues` and `dataSourceExists`
on the adapter for `SchemaMigration#versions` / `#table_exists?`
(`schema_migration.rb:115-153`). Every one of those is reached through an
`as unknown as ConnectionPool` cast at the `pool` field, so nothing type-checks
against the real contract.

That is why the pool was `undefined` for as long as it was: the compiler could
not see the mismatch. Each new AR collaborator the sandbox reaches will add
another hand-written method to the shim, and `db:migrate` /
`db:rollback` (see `frontiers-db-migrate-still-blocked-on-eval-context`) will
reach `Migrator`, `SchemaMigration#createTable`, `internalStringOptionsForPrimaryKey`
and the DDL surface next.

Rails has no counterpart to weigh a duck-typed pool against: an adapter IS an
`AbstractAdapter` subclass and a pool IS a `ConnectionPool`
(`connection_adapters/abstract/connection_pool.rb`), which is what makes
`schema_migration.rb`'s plain sends safe.

## Converged shape

Make the sandbox's sql.js connection a real adapter — an `AbstractAdapter`
subclass over the sql.js handle, established through the ordinary
`ConnectionHandler` / `ConnectionPool` path — so `SchemaMigration`,
`InternalMetadata`, `Migrator` and the schema statements reach the surface they
were written against, and delete `SqlJsConnectionPool` and the
`as unknown as ConnectionPool` cast with it.

The website's own standalone helpers on `SqlJsAdapter` (`execRaw`, `query`,
`runSql`, `getTables`, `getColumns`) are a separate concern and can stay
wherever the sandbox UI needs them; this story is about the AR-facing half.

## Acceptance criteria

- [ ] The frontiers runtime's connection is an `AbstractAdapter` subclass
      reached through a real `ConnectionPool`; no `as unknown as ConnectionPool`.
- [ ] `SqlJsConnectionPool` and the hand-written `selectValues` /
      `dataSourceExists` stand-ins are gone, not re-homed.
- [ ] `runtime.test.ts` stays green, including both `db:migrate:status`
      branches PR #7161 added.
