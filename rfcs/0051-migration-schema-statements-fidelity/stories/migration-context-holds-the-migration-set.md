---
title: "migration-context-holds-the-migration-set"
status: closed
updated: 2026-07-30
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: duplicate of rename-merged-migrator-into-migrationcontext-and-migrator"
---

## Context

Two trails classes split what Rails puts in one place, and the seam shows up
as an unportable rake body.

Rails' `MigrationContext` (`activerecord/lib/active_record/migration.rb:1211`)
is the migration-set holder: constructed from
`migrations_paths, schema_migration, internal_metadata`
(`migration.rb:1214`), it exposes `migrate`, `rollback` (`:1246`), `forward`
(`:1250`), `up`, `down`, `run`, `open`, `get_all_versions`, `current_version`,
`needs_migration?` and `pending_migration_versions`. A pool hands one out via
`ConnectionPool#migration_context`
(`connection_adapters/abstract/connection_pool.rb:294-296`), which is what
lets the rake bodies read as one line:

- `db:rollback` — `migration_connection_pool.migration_context.rollback(step)`
  (`railties/databases.rake:269`)
- `db:forward` — `migration_connection_pool.migration_context.forward(step)`
  (`railties/databases.rake:278`)
- `db:rollback:<name>` — `pool.migration_context.rollback(step)`
  (`railties/databases.rake:254`)

In trails those responsibilities live in `Migrator`
(`packages/activerecord/src/migration.ts:2126` — `migrate`/`rollback`/
`forward`/`pendingMigrations`, and the discovery half at `:2643`), while the
class actually named `MigrationContext`
(`packages/activerecord/src/migration.ts:1658`) is a schema DSL: it wraps an
adapter and forwards `createTable` / `addIndex` / … to `SchemaStatements`.
`ConnectionPool#migrationContext`
(`connection-adapters/abstract/connection-pool.ts:534`) returns that schema
DSL, so it cannot answer `rollback`/`forward` and the pool seam Rails uses is
unavailable.

Consequence, hit while shipping #5616: `db:forward` had nowhere faithful to
land. The rake body was ported to a new `DatabaseTasks.forward`
(`packages/activerecord/src/tasks/database-tasks.ts`, sharing
`_stepMigrations` with the existing `DatabaseTasks.rollback` port) rather than
onto the pool. Rails has no `DatabaseTasks.forward` and no
`DatabaseTasks.rollback`, so both are extra surface standing in for the
missing `pool.migration_context`, and every future port of a
`migration_context`-shaped rake body faces the same choice.

## Acceptance criteria

- [ ] `MigrationContext` in `packages/activerecord/src/migration.ts` carries
      Rails' migration-set surface (`migrate`, `rollback`, `forward`, `up`,
      `down`, `run`, `open`, `getAllVersions`, `currentVersion`,
      `needsMigration`, `pendingMigrationVersions`), constructed from
      migrations paths + schemaMigration + internalMetadata as in
      `migration.rb:1214`.
- [ ] The schema-DSL responsibilities currently sitting on `MigrationContext`
      move to whichever host matches Rails' layout (the connection's
      `SchemaStatements` / `Migration`), so the name means what it means in
      Rails. `api:compare` must not gain surface from the move.
- [ ] `ConnectionPool#migrationContext`
      (`connection-adapters/abstract/connection-pool.ts:534`) returns the
      migration-set context, mirroring `connection_pool.rb:294-296`.
- [ ] `DatabaseTasks.rollback` / `DatabaseTasks.forward` are deleted and their
      callers (`packages/trailties/src/commands/db.ts` rollback / forward /
      migrate:redo, wired in #5616) call `pool.migrationContext.rollback(step)`
      / `.forward(step)` the way `databases.rake:254,269,278` does. Extra
      surface drops by two.
- [ ] Existing coverage keeps passing: `db:rollback:namespace works` and
      `db forward and db migrate:redo step the named database`
      (`packages/trailties/src/commands/db.test.ts`), plus
      `packages/activerecord/src/tasks/database-tasks-rollback.trails.test.ts`.
- [ ] Note the split if it needs more than one PR — this is likely over the
      500 LOC ceiling and should be scoped/registered accordingly rather than
      fanned out ad hoc.
