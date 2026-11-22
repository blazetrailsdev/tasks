---
title: "sqlite3-libsql-replica-sync-reaches-the-engine"
status: draft
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# sqlite3: the libsql replica adapter reaches sync() through the engine

## Context

`packages/sqlite3/lib/engine/libsql.ts` exports `replicaEngine(options)`, whose `EngineDatabase` carries a `sync()` (libsql's embedded-replica pull, `Database#sync` in the `libsql` npm package). The sqlite3 gem has no such method (`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb`), so it is receipted `@noRailsEquivalent CONVERGEABLE sqlite3-libsql-replica-sync-reaches-the-engine` and is not on `SQLite3::Database`. The AR side still reaches `sync()` through the legacy `SyncableSqliteConnection` (`packages/sqlite3/lib/libsql.ts`, `packages/activerecord/test/cases/libsql-adapter.trails.test.ts:3`).

## Acceptance criteria

- [ ] Once `sqlite3-adapter-new-client-is-database-new` builds `new SQLite3.Database(..., { engine: replicaEngine(...) })`, the `libsql-replica` adapter path calls `db._engine.sync()` explicitly, and `SyncableSqliteConnection` is deleted.
- [ ] The receipt on `replicaEngine` is either retired or turned `PERMANENT` after an operator ruling that engine-specific surface outside the gem is permanent.
