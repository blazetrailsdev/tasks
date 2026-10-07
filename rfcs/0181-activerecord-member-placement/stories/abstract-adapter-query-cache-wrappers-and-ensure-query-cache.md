---
title: "activerecord: AbstractAdapter's QueryCache wrappers and invented _ensureQueryCache converge onto the included module"
status: draft
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/abstract-adapter.ts` (around `:2050-2090` after trails#8608) still hosts delegation wrappers over the `QueryCache` module, where Rails defines the methods once in the module and `AbstractAdapter` gets them through `include QueryCache` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:194-235`):

- `get queryCache` / `set queryCache` are class accessors for `attr_accessor :query_cache` (`query_cache.rb:194`). The module file already exports a `queryCache` function, so the reader exists twice.
- `get queryCacheEnabled`, `cache`, `enableQueryCacheBang`, `uncached`, `disableQueryCacheBang` and `clearQueryCache` are one-line wrappers that `.call` the mixin functions (`queryCacheEnabledGet.call(this as unknown as QueryCacheHost)` and siblings) for `query_cache_enabled`, `cache`, `enable_query_cache!`, `uncached`, `disable_query_cache!`, `clear_query_cache` (`query_cache.rb:201-235`).
- `private _ensureQueryCache()` lazily assigns `new Store()` to `@query_cache` before four of those wrappers run. Rails has no such method and never builds a `Store` on the adapter: `@query_cache` is `nil` from `initialize` (`:196-199`) until the pool assigns it in `checkout_and_verify` (`connection.query_cache ||= query_cache`, `:134`), and the adapter methods delegate straight to `pool` (`:205-234`).

These were not `inlined-from` rows, because the module twin has bodies for the same names; the report only sees a host body with no module body. trails#8608 moved the `@query_cache` seat into the mixin's `[initialize]` hook and left these alone as out of scope.

## Acceptance criteria

- [ ] The six methods and the `query_cache` accessor are installed on `AbstractAdapter` by `include(AbstractAdapter, QueryCacheMixin)`; `abstract-adapter.ts` declares no body for any of them and no `*.call(this as unknown as QueryCacheHost)` wrapper remains.
- [ ] `attr_accessor :query_cache` is one accessor on the `QueryCache` module (a getter/setter pair, as `transactionManager` is on `DatabaseStatements` since trails#8608), not a function plus a class getter.
- [ ] `_ensureQueryCache` is deleted. Any test that depended on the adapter building its own `Store` is fixed by going through the pool as Rails does, not by keeping the helper.
- [ ] `pnpm parity:api:extra:gate`, `pnpm parity:api:calls`, `pnpm parity:api:pins` and `scripts/mixin-declaration-drift.test.ts` stay green; `query-cache.test.ts` is green on SQLite, PG and MySQL.
