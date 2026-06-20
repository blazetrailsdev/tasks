---
title: "fix: CpkOrder._counterCacheColumns gets cpk_books_count from pending flush instead of books_count"
status: in-progress
updated: 2026-06-20
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3696
claim: "2026-06-20T02:46:42Z"
assignee: "cpk-counter-cache-columns-pending-flush"
blocked-by: null
---

## Context

`addCounterCacheCallbacks` (`belongs-to.ts:77`) calls `counterCacheColumn()` at module-import time during `CpkBook`'s static block. In `cpk.ts`, `CpkBook` is defined before `CpkOrder`. At that moment `modelRegistry.get("CpkOrder")` returns `null` → catch → `belongsToCounterCacheColumn(counterCache, "CpkBook")` = `cpk_books_count`. That value goes into `pendingCounterCacheColumns`. When `registerModel("CpkOrder", CpkOrder)` runs later, `flushPendingCounterCacheColumns` writes `cpk_books_count` into `CpkOrder._counterCacheColumns` instead of `books_count`.

`_counterCacheColumns` is used in `persistence.ts:1547` to suppress counter-cache columns from normal attribute saves — so `books_count` is NOT suppressed (could be overwritten by a save that bypasses `updateCounterCaches`) and `cpk_books_count` IS suppressed (no-op, column doesn't exist).

Identified as a latent issue in review #7 of PR #3607 (cpk-counter-cache-column-demodulize-convergence). No current test exercises a `CpkOrder.save` path that would expose this.

## Acceptance criteria

- `CpkOrder._counterCacheColumns` contains `books_count`, not `cpk_books_count`, after `registerModel("CpkOrder", CpkOrder)` flushes pending columns
- A save to `CpkOrder` (e.g. updating `status`) does not overwrite `books_count` with a stale value
- `counter-cache.test.ts` and `associations.test.ts` remain green
