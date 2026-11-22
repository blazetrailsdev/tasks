---
title: "sqlite3-libsql-remote-engine"
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

# sqlite3: the libsql remote (Turso over HTTP) driver becomes an engine

## Context

`sqlite3-libsql-engines` moved the local and embedded-replica libsql drivers to `packages/sqlite3/lib/engine/libsql.ts` (`engine`, `replicaEngine`). `libsqlRemoteDriver` (`packages/sqlite3/lib/libsql.ts`, `openRemoteDatabase`) still implements `SqliteDriver` / `SqliteConnection`: it opens `new Database(url, { authToken })`, refuses `SQLITE_OPEN_SHAREDCACHE`, and cannot be tested offline. The engine's `open` checks `File.isExist` when `CREATE` is unset and sets `PRAGMA query_only` for `READONLY`; neither applies to a URL.

## Acceptance criteria

- [ ] `engine/libsql.ts` exports a `remoteEngine({ authToken })` implementing `EngineDatabase` / `EngineStatement` only, translating errors through the same `errors` (`rawCode & 0xff`).
- [ ] `libsqlRemoteDriver` is deleted with the rest of the legacy drivers by `sqlite3-retire-the-sqlite-driver-interfaces`, or reduced to the engine.
- [ ] A test pins the open arm against a URL without a network (option shape, SHAREDCACHE refusal).
