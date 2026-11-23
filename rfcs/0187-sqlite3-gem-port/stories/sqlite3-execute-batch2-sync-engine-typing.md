---
title: "sqlite3: executeBatch2 on a sync engine answers unknown[], not a union"
status: ready
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# sqlite3: executeBatch2 on a sync engine answers unknown[], not a union

## Context

`Database#execute_batch2` (`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb:329-338`) is synchronous. trails' `executeBatch2` (`packages/sqlite3/lib/database.ts`) answers `unknown[] | Promise<unknown[]>` whatever the engine. So in a synchronous callback (a `Database.new` block, a busy handler), a caller on better-sqlite3 has to cast: `packages/sqlite3/test/test-database-flags.test.ts:107-108` and `test-integration-pending.test.ts:52` write `executeBatch2(...) as unknown[]`. That cast would drop a promise silently if the suite moved to an async engine. The constructor's block overload already narrows on `SyncCloseEngineDatabase`.

## Acceptance criteria

- [ ] With a sync engine, `executeBatch2` is typed `unknown[]` (overload or engine-generic `Database`), and a sync entry handed a promise raises, as CLAUDE.md "Every promise has an owner" requires.
- [ ] The three `as unknown[]` casts in the ported tests are removed.
