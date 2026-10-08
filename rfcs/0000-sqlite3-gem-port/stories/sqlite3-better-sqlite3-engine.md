---
title: "sqlite3: better-sqlite3 becomes an engine under SQLite3::Database"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: drivers
packages: ["sqlite3", "activerecord"]
deps: ["sqlite3-database-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0000-sqlite3-gem-port § "Package shape": each npm client implements the internal engine
interface (the private C primitives), not the gem surface.

`sqlite/better-sqlite3.ts` (299 lines) implements `SqliteStatement` + `SyncSqliteStatement` as
`BetterSqlite3Statement` (`:50-`) and exports `betterSqlite3Driver`, under a file-level cover
(`:1`). It is the default engine and the one the whole AR `sqlite-mem` lane runs on:
`packages/activerecord/src/test-setup-worker-db.ts:4`, `packages/activerecord/src/cases/helper.ts:1`, `packages/activerecord/src/support/sqlite-template.ts:2`.
better-sqlite3 has no `step`: a statement runs to completion (`run` / `all` / `iterate`).
`step` + `done?` map onto an iterator held by the engine statement.

## Acceptance criteria

- [ ] `packages/sqlite3/src/engine/better-sqlite3.ts` exports an engine implementing the package's internal engine interfaces and nothing else; `SqliteDriver` / `SqliteConnection` / `SqliteStatement` are no longer implemented in it.
- [ ] Its file-level `@noRailsEquivalent CONVERGEABLE sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem` cover is gone; what remains exported is either private to the package or carries a per-declaration receipt.
- [ ] Error translation happens once, in `Statement` / `Database`, through `rbSqlite3Raise`; the engine's part is reporting the native status code. This engine's branch of `nativeStatus` (`errors.ts:195-210`) moves into the engine.
- [ ] The matching `packages/activerecord/src/connection-adapters/better-sqlite3-adapter.ts` builds `new SQLite3.Database(...)` over this engine; the engine's existing `*.trails.test.ts` passes with only its construction changed.
- [ ] `better-sqlite3`'s `timeout` constructor option is how `busy_handler_timeout=` is honoured; setting it after open is `PRAGMA busy_timeout`, which is what `sqlite3_busy_timeout` does. Cite `database.rb:692-700`.

## Verification

```bash
pnpm vitest run packages/sqlite3 && pnpm parity:api:receipts:gate
```
