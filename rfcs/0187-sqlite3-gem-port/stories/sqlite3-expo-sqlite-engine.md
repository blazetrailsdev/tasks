---
title: "sqlite3: expo-sqlite becomes an engine under SQLite3::Database"
status: draft
updated: 2026-10-08
rfc: "0187-sqlite3-gem-port"
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

RFC 0187-sqlite3-gem-port § "Package shape": each npm client implements the internal engine
interface (the private C primitives), not the gem surface.

`sqlite/expo-sqlite.ts` (399 lines), `expoSqliteDriver`, file-level cover at `:1`; async-only
(`execAsync`, `prepareAsync`, `closeAsync`). RFC 0182 has two stories on its error classes
(`expo-sqlite-driver-raises-sqlite3-gem-exception-classes`,
`expo-sqlite-exec-raises-sqlite3-gem-exception-classes`); check their status and take what
they landed.

## Acceptance criteria

- [ ] `packages/sqlite3/src/engine/expo-sqlite.ts` exports an engine implementing the package's internal engine interfaces and nothing else; `SqliteDriver` / `SqliteConnection` / `SqliteStatement` are no longer implemented in it.
- [ ] Its file-level `@noRailsEquivalent CONVERGEABLE sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem` cover is gone; what remains exported is either private to the package or carries a per-declaration receipt.
- [ ] Error translation happens once, in `Statement` / `Database`, through `rbSqlite3Raise`; the engine's part is reporting the native status code. This engine's branch of `nativeStatus` (`errors.ts:195-210`) moves into the engine.
- [ ] The matching `packages/activerecord/src/connection-adapters/expo-sqlite-adapter.ts` builds `new SQLite3.Database(...)` over this engine; the engine's existing `*.trails.test.ts` passes with only its construction changed.
- [ ] `changes` and `columnCount` are answered from the last result without I/O, as today.

## Verification

```bash
pnpm vitest run packages/sqlite3 && pnpm parity:api:receipts:gate
```
