---
title: "wire-load-async-through-future-result"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6530
claim: "2026-08-14T16:17:48Z"
assignee: "wire-load-async-through-future-result"
blocked-by: null
closed-reason: null
---

## Context

PR #6515 ported `FutureResult` / `AsynchronousQueriesTracker` and wired the
async arm of `select` (story `call-args-ar-select-all-empty-async-row`). Two
pieces of the `load_async` chain are deliberately NOT in that PR, and together
they are what stands between the ported infrastructure and a working
`Relation#load_async`.

**1. `QueryCache#select_all`'s async arm is unported.**
Rails splits by `async`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:236-253`):

```ruby
if async
  result = lookup_sql_cache(sql, name, binds) || super(...)
  FutureResult.wrap(result)
else
  cache_sql(sql, name, binds) { super(...) }
end
```

trails takes the `cache_sql` shape unconditionally —
`makeCachedSelectAll` in
`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:408-462`,
whose comment still reads "trails has no async FutureResult path, so it always
takes the `lookup_sql_cache || cacheSql` shape". That premise is now stale:
PR #6515 added the async path. The wrapper is also declared `async function
cachedSelectAll(...): Promise<Result>`, so even when the base `selectAll` hands
back a live `FutureResult`, the cache wrapper's own promise adopts it (see 2)
and the handle is lost whenever the query cache is enabled.

**2. `Relation#loadAsync` does not route through `selectAll(..., { async })`.**
`packages/activerecord/src/relation.ts:2117` is a trails-shaped `loadAsync` that
kicks off `toArray()` and memoizes the in-flight promise in `_loadAsyncPromise`.
It never reaches the FutureResult path, so nothing in the repo currently
constructs one outside tests.

**The thenable hazard this has to be built against.** `FutureResult#then`
implements the JS thenable protocol (it must — `await futureResult` has to
work). Consequently ANY `async function` that returns a `FutureResult` resolves
it away: the function's own promise adopts the thenable and settles with the
final `Result` instead. PR #6515 fixed this for `select` and
`DatabaseStatements.selectAll` by making both non-`async`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`),
so they hand the pending handle straight back. Any further link in the chain
must follow the same rule or it silently re-collapses the contract.

## Acceptance criteria

1. `makeCachedSelectAll` ports Rails' `async` split (`query_cache.rb:244-249`):
   `lookupSqlCache(...) || super`, wrapped in `FutureResult.wrap`, for the async
   arm; `cacheSql { super }` for the sync arm. Its stale "trails has no async
   FutureResult path" comment goes.
2. `cachedSelectAll` no longer collapses a `FutureResult` returned by the base
   `selectAll` — i.e. it is not an `async function` that returns one. A test
   asserts a caller gets a `pending()` `FutureResult` back with the query cache
   ENABLED, not just when it is off.
3. `Relation#loadAsync` routes through `selectAll(..., { async: true })` so the
   ported FutureResult path is what backs it, replacing the bespoke
   `_loadAsyncPromise` memoization at `relation.ts:2117-2140` (or that
   memoization is explicitly retained with a cited reason).
4. `ActiveRecord.asyncQueryExecutor` non-null makes a real end-to-end
   `Model.all.loadAsync()` issue its query through `FutureResult::SelectAll`,
   covered by a test against the canonical schema/fixtures.
