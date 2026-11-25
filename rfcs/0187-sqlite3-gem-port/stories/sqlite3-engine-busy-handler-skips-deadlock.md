---
title: "sqlite3-engine-busy-handler-skips-deadlock"
status: ready
updated: 2026-11-25
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

SQLite's C core skips the registered busy handler when waiting could deadlock: a connection that holds a SHARED lock and wants RESERVED gets `SQLITE_BUSY` at once (sqlite3 `pager.c` / `btree.c` `btreeInvokeBusyHandler`, which is not called in that case). The sqlite3 gem relies on that: `Database#busy_handler_timeout=` (`vendor/sqlite3/v2.7.3/lib/sqlite3/database.rb`) is never consulted for a deadlock.

trails' engines emulate the handler in JS: `withBusyHandler` (`packages/sqlite3/lib/engine/busy-handler.ts`) retries any `SQLITE_BUSY` the client raises. The client does not say whether the BUSY was a deadlock, so the retry happens anyway. Since trails#10705 put `SQLite3Adapter` on `SQLite3::Database`, a deadlocked write (BEGIN DEFERRED, SELECT, then INSERT while another connection holds RESERVED) waits out the whole `timeout` and only then raises. Before #10705 the adapter-level `_sharedLockHeld` guess raised at once, but that guess was invented surface and has been removed.

## Acceptance criteria

- [ ] An engine knows when a BUSY is a deadlock, from the client's extended error code or from the connection's transaction state as SQLite itself reads it, and on that error `withBusyHandler` does not call the handler.
- [ ] A trails test pins that a deadlocked write under `timeout: 1000` raises in well under the timeout, on better-sqlite3 and node:sqlite.
- [ ] No adapter-level lock tracking comes back; the fix lives in the engine layer, where the gem's C extension sits.
