---
title: "expo-sqlite engine's busy loop moves onto Database#_busyRetry"
status: in-progress
updated: 2026-11-26
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: trails#10776
claim: "2026-11-26T01:45:14Z"
assignee: "sqlite3-expo-engine-busy-retry-on-the-gem-layer"
blocked-by: null
closed-reason: null
---

## Context

trails#10705 moved busy handling to the gem layer: `Database#busyHandler` keeps the block, and `Database#_busyRetry` (`packages/sqlite3/lib/database.ts`) retries the engine's `prepare` and `step` through `withBusyHandler` (`packages/sqlite3/lib/engine/busy-handler.ts`). That stands in for C `rb_sqlite3_busy_handler` (`vendor/sqlite3/v2.7.3/ext/sqlite3/database.c`), which SQLite invokes for every BUSY on the connection. The expo-sqlite engine still runs its own private awaited loop (`packages/sqlite3/lib/engine/expo-sqlite.ts:72`, `withBusyHandler`, used by `prepareStatement` and `execBatch`). `_busyRetry` only catches synchronous throws, so on expo the gem layer never sees a BUSY, and the busy-handler contract is implemented twice.

## Acceptance criteria

- [ ] The shared `withBusyHandler` treats an `attempt()` whose promise rejects with BUSY like a synchronous BUSY throw: it calls the handler with the running count, awaits it, and retries.
- [ ] expo-sqlite's private `withBusyHandler` is deleted. Its `prepare` and `step` go through `Database#_busyRetry`, and its `execBatch` uses the shared helper per statement.
- [ ] A trails test with a fake async engine pins that a BUSY rejection calls the handler with a growing count and stops when the handler answers `false`.
