---
title: "enable/disableQueryCache duck-type the pool; Rails sends them bare"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6259
claim: "2026-08-08T19:57:19Z"
assignee: "date-state-julian-only-spellings-unbuildable"
blocked-by: null
closed-reason: null
---

## Context

`enableQueryCache`, `enableQueryCacheBang`, `disableQueryCache` and
`disableQueryCacheBang` (`connection-adapters/abstract/query-cache.ts:346,367,389,410`)
each guard their pool send with a duck-type probe and silently do nothing when
the pool has no such member:

```ts
if (this.pool?.enableQueryCache) {
  return this.pool.enableQueryCache(fn) as Promise<T>;
}
```

Rails sends them bare, exactly as `clear_query_cache` does
(`activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:200-234`):
`pool.enable_query_cache { ... }` — a pool-less adapter raises NoMethodError,
because Ruby's `NullPool` (`abstract/connection_pool.rb:24-48`) defines none of
them and overrides no `method_missing`.

This is the same deviation `clear-query-cache-duck-types-the-pool` converged for
`clear_query_cache` in #6242. #6251 widened `NullPool`'s `get` trap to raise for
every non-member send, so these four probes are now the remaining readers that
depend on a pool answering `undefined` for a member Ruby's NullPool lacks — and
because they are `?.`-guarded truthiness probes rather than `in` checks, the
widened trap makes them _raise_ where they used to fall through.

## Converged shape

- Each of the four bodies sends `this.pool.<method>` bare, as
  `query_cache.rb:200-234` does.
- Any caller that reaches one of them with a pool-less adapter gets a real
  `ConnectionPool` (`support/pooled-sqlite-adapter.ts` is the seam #6242 used),
  never a re-added name on a NullPool allowlist.

## Acceptance criteria

- [ ] The four bodies carry no `?.`/truthiness probe around the pool send.
- [ ] A pool-less adapter raises NoMethodError from each, as in Ruby.
- [ ] No new baseline rows or allowlist entries.
