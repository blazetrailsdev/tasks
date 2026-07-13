---
title: "query-cache-dirties-wiring-incomplete"
status: in-progress
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4852
claim: "2026-07-13T20:32:34Z"
assignee: "query-cache-dirties-wiring-incomplete"
blocked-by: null
---

## Context

Faithfully porting `query_cache_test.rb` (story `converge-query-cache-one-schema`,
RFC 0048) surfaced that trails' `dirties_query_cache` wiring diverges from Rails:

1. **Over-clears on writes.** Rails wires `dirties_query_cache` on the _public_
   write methods (`:create, :insert, :update, :delete, :truncate,
:exec_insert_all`, …) so a single logical write clears the query cache
   exactly once. trails wires it on the low-level `executeMutation`
   (`connection-adapters/abstract/query-cache.ts`), through which one write
   funnels at several nested layers (`insert → insertStatement → execInsert`),
   clearing 2–3 times per write.
2. **Does not dirty on rollback.** Rails' list includes
   `:rollback_to_savepoint, :rollback_db_transaction, :restart_db_transaction`;
   trails does not, so a rolled-back write's cached SELECT result leaks
   (`query_cache_test.rb` `test_query_cache_doesnt_leak_cached_results_of_rolled_back_queries`).
3. **`exists?` and raw `execute`/`exec_query` bypass the cache.** trails
   `Relation#exists` runs its `SELECT 1 AS one … LIMIT 1` probe via the raw
   `execute()` path rather than the cached `selectAll` override, so repeated
   probes are not served from the query cache. Rails routes them through
   `select_rows → select_all` (cached) and also clears the cache on any public
   `execute`/`exec_query`.

These were left **tracked-pending-convergence** (skipped) in
`packages/activerecord/src/query-cache.test.ts` rather than bending the tests:

- QueryCacheTest: `execute clear cache`, `exec query clear cache`,
  `exists queries with cache`, `query cache doesnt leak cached results of rolled back queries`
- QueryCacheExpiryTest: `update`, `destroy`, `insert`, `insert all`,
  `insert all bang`, `upsert all`, `cache is expired by habtm update`,
  `cache is expired by habtm delete`

## Acceptance criteria

- [ ] Move `dirties_query_cache` wiring from `executeMutation` to the public
      write methods Rails wraps (`:create, :insert, :update, :delete,
:truncate, :truncate_tables, :rollback_to_savepoint,
:rollback_db_transaction, :restart_db_transaction, :exec_insert_all`,
      plus `:exec_query`/`:execute`), so each logical write clears once and
      rollbacks dirty the cache.
- [ ] Route `Relation#exists` through the cached read path so repeated probes
      hit the query cache.
- [ ] Un-skip the tracked cases listed above in `query-cache.test.ts`.
