---
title: "sqlite3: node:sqlite becomes an engine under SQLite3::Database"
status: draft
updated: 2026-10-08
rfc: "0187-sqlite3-gem-port"
cluster: drivers
packages: ["sqlite3", "activerecord"]
deps: ["sqlite3-database-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0187-sqlite3-gem-port § "Package shape": each npm client implements the internal engine
interface (the private C primitives), not the gem surface.

`sqlite/node-sqlite.ts` (302 lines), `nodeSqliteDriver`, file-level cover at `:1`. `node:sqlite`
is built in, loaded through `createRequire` (`:2`), and raises `LoadError` on a Node without it.
Its errors carry `errcode` (the branch of `nativeStatus` at `errors.ts:198`) and
`ERR_INTERNAL_SQLITE_ERROR` (`errors.ts:215`).

## Acceptance criteria

- [ ] `packages/sqlite3/src/engine/node-sqlite.ts` exports an engine implementing the package's internal engine interfaces and nothing else; `SqliteDriver` / `SqliteConnection` / `SqliteStatement` are no longer implemented in it.
- [ ] Its file-level `@noRailsEquivalent CONVERGEABLE sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem` cover is gone; what remains exported is either private to the package or carries a per-declaration receipt.
- [ ] Error translation happens once, in `Statement` / `Database`, through `rbSqlite3Raise`; the engine's part is reporting the native status code. This engine's branch of `nativeStatus` (`errors.ts:195-210`) moves into the engine.
- [ ] The matching `packages/activerecord/src/connection-adapters/node-sqlite-adapter.ts` builds `new SQLite3.Database(...)` over this engine; the engine's existing `*.trails.test.ts` passes with only its construction changed.

## Verification

```bash
pnpm vitest run packages/sqlite3 && pnpm parity:api:receipts:gate
```
