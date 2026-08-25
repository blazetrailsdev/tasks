---
title: "converge-query-cache-install-executor-hooks-signature"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6532
claim: "2026-08-14T17:22:10Z"
assignee: "converge-isolated-execution-state-delete-returns-value"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::QueryCache.install_executor_hooks` is
`executor.register_hook(self)` with `executor = ActiveSupport::Executor`
(`vendor/rails/activerecord/lib/active_record/query_cache.rb:51-53`), and
`QueryCache.run` takes no arguments — it reads the pools itself:
`ActiveRecord::Base.connection_handler.each_connection_pool.reject(&:query_cache_enabled)`
(`query_cache.rb:37-42`).

trails' port at `packages/activerecord/src/query-cache.ts:93` diverges: it takes
`(executor?, targets)`, where `targets` is an array or thunk of pools the caller
supplies, `run(targets)` filters that list instead of reading the handler, and an
absent `executor` makes the whole call a silent no-op. The `executor` default of
`ActiveSupport::Executor` is missing even though `Executor` is now ported
(`packages/activesupport/src/executor.ts`, PR #6529).

That divergence has now reached a second call site. PR #6529 ported the
`active_record.set_executor_hooks` initializer (`railtie.rb:288-292`) into
`packages/activerecord/src/trailtie.ts`; the tracker and `ConnectionPool` lines
are one-liners as in Rails, but the `QueryCache` line has to build the pool list
by hand to satisfy the divergent signature:

```ts
QueryCache.installExecutorHooks(Executor, () => {
  const pools: ConnectionPool[] = [];
  Base.connectionHandler.eachConnectionPool((pool) => pools.push(pool));
  return pools;
});
```

## Acceptance criteria

1. `QueryCache.installExecutorHooks(executor = Executor)` matches
   `query_cache.rb:51-53` — one argument, defaulted, body
   `executor.registerHook(QueryCache)`.
2. `QueryCache.run()` takes no arguments and reads
   `Base.connectionHandler.eachConnectionPool` itself, as `query_cache.rb:37-42`
   does; `complete(pools)` is unchanged.
3. The `trailtie.ts` `active_record.set_executor_hooks` initializer collapses to
   Rails' three bare calls, with no hand-built pool list.
4. `query-cache.test.ts` / `query-cache.trails.test.ts` and
   `trailtie.test.ts`'s executor-hook test stay green.
5. `pnpm parity:api:calls` / `parity:api:calls:args` stay green — this should
   retire rows rather than add any.
