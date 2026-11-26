---
title: "SQLite engines read the transaction state for deadlock detection; libsql and bun implement isDeadlock"
status: draft
updated: 2026-11-26
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10776 added deadlock detection to the busy handler. When a connection holds a read lock and asks for a write lock, SQLite returns SQLITE_BUSY without calling the handler (`sqlite3BtreeBeginTrans`, which retries only while `pBt->inTransaction == TRANS_NONE`). The port reaches that rule through `EngineErrors#isDeadlock` (`packages/sqlite3/lib/database.ts`) and `withBusyHandler` (`packages/sqlite3/lib/engine/busy-handler.ts`). Only better-sqlite3 (`lib/engine/better-sqlite3.ts`, `locked`) and node:sqlite (`lib/engine/node-sqlite.ts`) implement it. Neither driver exposes `sqlite3_txn_state`, so each engine works out the lock it holds from SQL text with `lockKind` (busy-handler.ts):

- a reader counts as SHARED;
- a write, `RETURNING`, or `BEGIN IMMEDIATE` / `BEGIN EXCLUSIVE` counts as RESERVED;
- transaction control and PRAGMA reads count as no lock.

Known misclassifications:

- `SELECT 1` counts as SHARED, which gives a false deadlock.
- `PRAGMA x = y` counts as RESERVED, which misses a deadlock and so waits out the full timeout.

The libsql and bun:sqlite engines have no `isDeadlock`, so a deadlocked write there waits out the whole `timeout`.

## Acceptance criteria

- [ ] Each engine reads the transaction state as SQLite itself holds it wherever its driver allows. Possible sources: `sqlite3_txn_state` through `PRAGMA`/SQL, a driver API, or a native binding the engine already loads. Where no driver allows it, `lockKind` stays the fallback.
- [ ] libsql and bun:sqlite engines implement `isDeadlock`.
- [ ] Each engine passes the existing deadlock tests from `engine-better-sqlite3.trails.test.ts`: "skips the busy handler for a write that would deadlock on a held read lock", "calls the busy handler for a write after a statement that took no read lock", and the COMMIT-wait test.
