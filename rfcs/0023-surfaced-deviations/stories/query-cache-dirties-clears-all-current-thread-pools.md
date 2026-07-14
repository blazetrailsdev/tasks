---
title: "dirties_query_cache must clear all current-thread pools, not just the local connection"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the multi-role query-cache test port (PR #4850, merged) and NOT
covered by `query-cache-dirties-wiring-incomplete` (now `done` — it reworked
the wiring onto public methods / rollback / exists, but left this facet).

Rails' `dirties_query_cache` decorator clears the query cache on **all** of the
current thread's connection pools:

    if pool.dirties_query_cache
      ActiveRecord::Base.clear_query_caches_for_current_thread
    end

(`connection_adapters/abstract/query_cache.rb:24-25` →
`connection_handling.rb:258` iterates `each_connection_pool { pool.clear_query_cache }`).

trails' `wireDirties`
(`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:576`)
clears only `this._queryCache!.clear()` — the writing connection's OWN Store.
So a write under the `:writing` role leaves the `:reading` pool's cache stale.
trails already has the method Rails calls —
`clearQueryCachesForCurrentThread` (`connection-handling.ts:349`, already used
by `reload` at `persistence.ts:1391`) — so the fix is likely to have the
decorator call it (via the connection's `Base`/handler) instead of the local
`this._queryCache.clear()`, preserving the `_writeDirtyDepth` / `times: 1`
collapse semantics.

This blocks one tracked-skipped case in
`packages/activerecord/src/query-cache.test.ts`:

- QueryCacheTest: `clear query cache is called on all connections`
  (the `it.skip` there references `query-cache-dirties-wiring-incomplete`;
  repoint it here once fixed).

## Acceptance criteria

- [ ] A dirtying write clears the query cache on every pool of the current
      thread (mirroring `clear_query_caches_for_current_thread`), not just the
      writing connection's own Store.
- [ ] The `times: 1` / single-logical-write collapse (`_writeDirtyDepth`,
      `executeMutation` leaf) still holds.
- [ ] Un-skip `clear query cache is called on all connections` in
      `query-cache.test.ts`.
