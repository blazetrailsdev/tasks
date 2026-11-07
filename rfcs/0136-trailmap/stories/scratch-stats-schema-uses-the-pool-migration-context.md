---
title: "trailmap: build the scratch stats schema with the Stats pool's migrationContext, not a hand-rolled migration loop"
status: draft
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#126 made `test/models/stats-schema.ts` (`createScratchStatsDatabase`) build the scratch stats tables from `db/stats-sync-migrate`. It does this by globbing the migration files and calling `execMigration(adapter, "up")` on each exported `Migration` subclass. It worked that way because `new MigrationContext([...])` resolves its pool through `DatabaseTasks.migrationConnectionPool()`, which is `Base`'s pool, and the tests have already pointed `Base` at the task database.

The vendored trails already has the per-pool entry point Rails has (`pool.migration_context`): `ConnectionPool#migrationContext`, at `@blazetrails/activerecord/dist/connection-adapters/abstract/connection-pool.js:214`. It builds a `MigrationContext` from the pool's own `dbConfig.migrationsPaths`, `schemaMigration` and `internalMetadata`. The expected shape is `Stats.establishConnection({ ..., migrationsPaths: STATS_SYNC_MIGRATIONS_PATH })` followed by `await Stats.connectionPool().migrationContext.migrate()`. That would stamp `schema_migrations`, honour versions, and replace the hand loop.

If `migrate()` still runs the migrations on `Base`'s connection (each `Migration` resolves `this.connection` itself), that is a trails defect, and it goes in a trails story with a repro. This story then waits on it.

## Acceptance criteria

- `createScratchStatsDatabase` migrates through `Stats.connectionPool().migrationContext`, with no file glob or `execMigration` loop.
- The packages, parity and compare-run tests and `scripts/gate-ringo-parity.ts` pass unchanged.
- If the pool's context does not migrate the pool it came from, a trails story names the line and this story records it in `deps`.
