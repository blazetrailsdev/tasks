---
rfc: "0004-query-cache-mixin"
title: "Wire the live query-cache mixin, retire the wrapper"
status: closed
created: 2026-05-29
updated: 2026-05-29
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - query-cache
---

# RFC 0004 — Wire the live query-cache mixin, retire the wrapper

## Summary

trails has two query-cache implementations and the live one does not cache. The
`QueryCache` mixin is wired into the pool checkout path but never consults the
cache from `selectAll`; the `QueryCacheAdapter` wrapper is the only impl that
actually caches, and it is never instantiated outside tests. This RFC ports
Rails' `select_all` cache override into the mixin (making caching real), moves
`cache`/`uncached` onto the pool-based `QueryCache` class to preserve
api:compare, then migrates the tests and deletes the wrapper.

## Motivation

| Concern                   | `QueryCacheAdapter` wrapper | `QueryCache` mixin        |
| ------------------------- | --------------------------- | ------------------------- |
| enable/disable/clear API  | yes                         | yes                       |
| pool checkout wiring      | **no** (never live)         | yes (`checkoutAndVerify`) |
| **caches SELECT results** | **yes — only working impl** | **no — helpers unwired**  |

Verification:

- `new QueryCacheAdapter(...)` appears only in `query-cache.test.ts`. The pool's
  `checkout` → `checkoutAndVerify` returns the **raw** mixin adapter, unwrapped.
- The only reachable caller of `Store.computeIfAbsent` is inside the wrapper.
  The mixin's `cacheSql` also calls it, but `cacheSql` is unwired, so that path
  is never entered.
- The live `selectAll` delegates straight to the DB with no cache consultation.

Net: query caching is non-functional in the live path. The behavioral tests pass
**only because they run against the wrapper**.

## Design

The fix mirrors Rails (`query_cache.rb:236`), where the `QueryCache` module
**overrides `select_all`** to call `lookup_sql_cache(sql, ...) || super` on a hit
and `cache_sql(sql, ...) { super }` otherwise — wrapping the base `select_all`
from `database_statements.rb` via `super`, never editing it.

### Phase 1 — wire the mixin cache (feature)

Port the `select_all` override as a `selectAll` override in the `QueryCache`
mixin (`abstract/query-cache.ts`) that delegates to the base `selectAll`
(`abstract/database-statements.ts`) for the uncached path; write statements dirty
the cache via `dirties_query_cache`. The `lookupSqlCache`/`cacheSql` helpers
already exist — this wiring is what invokes them. **Must land and be proven
before Phase 3.** See [wire-mixin-cache](stories/wire-mixin-cache.md).

### Phase 2 — pool-based ActiveRecord::QueryCache (refactor, parity-preserving)

Relocate `cache`/`uncached` off the wrapper onto the `QueryCache` class as
pool-based statics matching Rails' `ClassMethods` (operate on `connection_pool`);
make `run`/`complete` pool-based. Keeps `query_cache.rb` at 5/5 while removing the
wrapper dependency. Subsumes connection-pool-gap-plan PF2. See
[pool-based-query-cache](stories/pool-based-query-cache.md).

### Phase 3 — migrate tests, delete the wrapper, collapse `.inner` walks (cleanup)

Migrate `query_cache_test.rb`-matched tests to the mixin adapter (names
verbatim), delete `QueryCacheAdapter` and its private helpers, drop its `index.ts`
export, and collapse the three `adapter.inner` resolver walks to direct static
lookups (`adapter.constructor.columnNameMatcher?.()`). See
[migrate-tests-delete-wrapper](stories/migrate-tests-delete-wrapper.md).

## Alternatives considered

- **Edit the base `selectAll` to cache.** Rejected — Rails caches via a module
  override wrapping `super`, not by changing the base statement method; editing
  the base diverges and entangles the uncached path.
- **Keep the wrapper as the cache, wire it into checkout.** Rejected — duplicates
  the mixin's enable/disable/pool surface; Rails has one cache path (the mixin),
  so converging on the mixin is the parity-faithful choice.

## Rollout

1. Phase 1 — [wire-mixin-cache](stories/wire-mixin-cache.md) (must land first).
2. Phase 2 — [pool-based-query-cache](stories/pool-based-query-cache.md).
3. Phase 3 — [migrate-tests-delete-wrapper](stories/migrate-tests-delete-wrapper.md).

## Open questions

1. **api:compare during Phase 1→2 window.** Phase 1 adds the mixin override
   while `cache`/`uncached` still live on the wrapper; confirm `query_cache.rb`
   stays ≥ its current 5/5 throughout, not just at the end.

## Changelog

- 2026-05-29: initial RFC, migrated from
  `trails/docs/activerecord/query-cache-mixin-plan.md`.
