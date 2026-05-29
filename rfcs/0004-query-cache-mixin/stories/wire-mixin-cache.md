---
title: "Phase 1 — wire the mixin cache into the live query path"
status: ready
rfc: "0004-query-cache-mixin"
cluster: query-cache
deps: []
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Query caching is **non-functional in the live path**: the pool's `checkout` →
`checkoutAndVerify` returns the raw `QueryCache`-mixin adapter, but the mixin's
`selectAll` does not consult the cache — only the unused `QueryCacheAdapter`
wrapper (`query-cache.ts`) actually caches, and it is never instantiated outside
tests.

Mirror Rails exactly: the `QueryCache` module **overrides `select_all`**
(`query_cache.rb:236`) to call `lookup_sql_cache(sql, ...) || super` on a hit and
`cache_sql(sql, ...) { super }` otherwise — wrapping the base `select_all` from
`database_statements.rb` via `super`, not editing it. Port this as a `selectAll`
override in the `QueryCache` mixin that delegates to the adapter's base
`selectAll` for the uncached path, and have write statements dirty the cache via
`dirties_query_cache`.

See RFC 0004 §Design (Phase 1).

## Acceptance criteria

- [ ] `QueryCache` mixin gains a `selectAll` override:
      `lookupSqlCache(sql) ?? <base selectAll via super/delegation>`, with the
      miss path going through `cacheSql(sql, ...)`
- [ ] Write statements dirty the cache (`dirtiesQueryCache`)
- [ ] Base `selectAll` in `abstract/database-statements.ts` stays untouched
      (override calls it via super/delegation)
- [ ] Cache-hit cases from `query_cache_test.rb` pass against the **mixin**
      adapter (verbatim names), not the wrapper

## Notes

Correction to fold in (from #2651): the unwired `selectAll(original)` **factory**
in `abstract/query-cache.ts` already returns a `cachedSelectAll` closure calling
the helpers — it is the factory that is never installed onto `AbstractAdapter`.
Files: `connection-adapters/abstract/query-cache.ts`, `abstract-adapter.ts`.

**Must land and be proven before [[migrate-tests-delete-wrapper]]** — test
migration depends on the mixin actually caching.
