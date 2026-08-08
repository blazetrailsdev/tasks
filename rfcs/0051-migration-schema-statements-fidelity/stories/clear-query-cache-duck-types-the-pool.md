---
title: "clear-query-cache-duck-types-the-pool"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6242
claim: "2026-08-08T15:51:54Z"
assignee: "clear-query-cache-duck-types-the-pool"
blocked-by: null
closed-reason: null
---

## Context

`clearQueryCache` (`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:424-430`)
duck-types the pool:

```ts
if (this.pool?.clearQueryCache) {
  this.pool.clearQueryCache();
  return;
}
this._queryCache?.clear();
```

Rails' `QueryCache#clear_query_cache`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:232-234`)
is the bare unchecked send `pool.clear_query_cache` — on a pool-less adapter
(`@pool = NullPool.new`, `abstract_adapter.rb:153`) it raises NoMethodError.
The `?.` fallback silently clears the adapter-local cache instead, so a
pool-less adapter looks like it cleared a pool cache it never had.

The same shape blocks the NullPool dispatch guard added by
`abstract-adapter-role-shard-cast-hides-ruby-nomethoderror`: that PR's NullPool
Proxy raises on `role`/`shard` only, because raising on every member Ruby's
NullPool lacks makes `sqlite3-introspection.test.ts` (6 tests) red through this
duck-typed reader. Converging the reader lets `NULL_POOL_UNDEFINED_METHODS`
(`connection-adapters/abstract/connection-pool.ts`) drop and the trap cover
every send, which is Ruby's actual dispatch.

## Acceptance criteria

- [ ] `clearQueryCache` is the bare `this.pool.clearQueryCache()` — no `?.`,
      no `_queryCache` fallback arm (`query_cache.rb:232-234`).
- [ ] The pool-less call sites that relied on the fallback (SQLite `alterTable`
      → `removeColumn`, see `sqlite3-adapter.ts:2354`) reach a real pool.
- [ ] `NULL_POOL_UNDEFINED_METHODS` is deleted and the NullPool `get` trap
      raises for every non-member string key.
