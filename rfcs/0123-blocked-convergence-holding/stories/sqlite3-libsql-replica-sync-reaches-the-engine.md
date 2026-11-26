---
title: "sqlite3-libsql-replica-sync-reaches-the-engine"
status: blocked
updated: 2026-11-25
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps:
  - sqlite3-adapter-new-client-is-database-new
deps-rfc: []
est-loc: null
priority: 3
pr: trails#10741
claim: "2026-11-25T14:14:43Z"
assignee: "sqlite3-libsql-replica-sync-reaches-the-engine"
blocked-by: "awaiting operator ruling in sqlite3-engine-module-surface-ruling"
closed-reason: null
---

# sqlite3: the libsql replica adapter reaches sync() through the engine

## Context

`packages/sqlite3/lib/engine/libsql.ts` exports `replicaEngine(options)`, whose `EngineDatabase` carries a `sync()` (libsql's embedded-replica pull, `Database#sync` in the `libsql` npm package). The sqlite3 gem has no such method (`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb`), so it is receipted `@noRailsEquivalent CONVERGEABLE sqlite3-libsql-replica-sync-reaches-the-engine` and is not on `SQLite3::Database`. The AR side still reaches `sync()` through the legacy `SyncableSqliteConnection` (`packages/sqlite3/lib/libsql.ts`, `packages/activerecord/test/cases/libsql-adapter.trails.test.ts:3`).

## Acceptance criteria

- [ ] Once `sqlite3-adapter-new-client-is-database-new` builds `new SQLite3.Database(..., { engine: replicaEngine(...) })`, the `libsql-replica` adapter path calls `db._engine.sync()` explicitly, and `SyncableSqliteConnection` is deleted.
- [ ] The receipt on `replicaEngine` is either retired or turned `PERMANENT` after an operator ruling that engine-specific surface outside the gem is permanent.
