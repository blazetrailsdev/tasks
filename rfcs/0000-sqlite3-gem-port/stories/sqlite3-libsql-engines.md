---
title: "sqlite3: the three libsql drivers become engines under SQLite3::Database"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: drivers
packages: ["sqlite3", "activerecord"]
deps: ["sqlite3-database-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 500
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

`sqlite/libsql.ts` (385 lines) exports `libsqlDriver`, `libsqlRemoteDriver`,
`libsqlReplicaDriver` and `SyncableSqliteConnection`, file-level cover at `:1`. The local and
replica drivers are synchronous (`libsql`'s better-sqlite3-compatible API); the remote one is
not. `libsqlReplicaDriver` adds `sync()`, which the gem has no method for.

Blocked: `libsql-remote-adapter-memory-placeholder-and-concurrency-override` (RFC 0123). Open
stories in RFC 0038 (`turso-libsql-adapter`) (`libsql-local-driver`,
`libsql-remote-mode`, `libsql-embedded-replica`, `libsql-replica-auto-sync`) touch the same
file; check their status before claiming and rebase onto whichever is in flight.

## Acceptance criteria

- [ ] `packages/sqlite3/src/engine/libsql.ts` exports an engine implementing the package's internal engine interfaces and nothing else; `SqliteDriver` / `SqliteConnection` / `SqliteStatement` are no longer implemented in it.
- [ ] Its file-level `@noRailsEquivalent CONVERGEABLE sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem` cover is gone; what remains exported is either private to the package or carries a per-declaration receipt.
- [ ] Error translation happens once, in `Statement` / `Database`, through `rbSqlite3Raise`; the engine's part is reporting the native status code. This engine's branch of `nativeStatus` (`errors.ts:195-210`) moves into the engine.
- [ ] The matching `packages/activerecord/src/connection-adapters/libsql-adapter.ts (and libsql-remote-adapter.ts, libsql-replica-adapter.ts)` builds `new SQLite3.Database(...)` over this engine; the engine's existing `*.trails.test.ts` passes with only its construction changed.
- [ ] `sync()` stays on the replica engine as engine-specific surface the replica adapter reaches explicitly, with a `@noRailsEquivalent` receipt in one of the two shapes; it is not added to `SQLite3.Database`.
- [ ] If the three do not fit one PR, ship local + replica and file remote as a new story with `pnpm tasks new`.

## Verification

```bash
pnpm vitest run packages/sqlite3 && pnpm parity:api:receipts:gate
```
