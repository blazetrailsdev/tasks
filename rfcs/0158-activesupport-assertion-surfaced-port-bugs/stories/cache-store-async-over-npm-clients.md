---
title: "cache-store-async-over-npm-clients"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Cache::Store` in trails is synchronous
(`packages/activesupport/src/cache/store.ts`: `fetch`/`read`/`write`/`delete`/
`exist`/`readMulti`/`writeMulti`/`fetchMulti`/`deleteMulti`, and the abstract
`readEntry`/`writeEntry`/`deleteEntry` hooks). Every Node memcached / Redis
client is async, so a `MemCacheStore` or `RedisCacheStore` that wraps a real
client cannot be ported onto it. trails#8057 tried: it ported both stores
onto the sync Store behind empty `TopLevel.Dalli` / `Redis` / `ConnectionPool`
seats, and was closed because empty seats are not worth shipping. The stores
must wrap npm packages, and they must be async from the beginning, not ported
sync and converted later.

Rails sources:
`vendor/rails/activesupport/lib/active_support/cache.rb` (Store, `lookup_store`
:85-97, `UNIVERSAL_OPTIONS` :26-38),
`cache/mem_cache_store.rb`, `cache/redis_cache_store.rb`, `cache/memory_store.rb`,
`cache/file_store.rb`, `cache/null_store.rb`.

An async Store cascades into every synchronous consumer. Each needs a
deliberate answer, since this is the cascade CLAUDE.md
§ "Serialization's dual sync/async hash" rejects for `as_json`:

- `actionview/src/helpers/cache-helper.ts:45-62`: the view `cache` helper
  `safeConcat`s `fragmentFor(...)` synchronously during template render, via
  `readFragment` -> `cacheStore.read`
  (`actionpack/src/abstract-controller/caching/fragments.ts:85-118`).
- `actionview/src/renderer/partial-renderer/collection-caching.ts:72`:
  `collectionCache().readMulti(...)` in the partial renderer.
- `actionpack/src/action-dispatch/middleware/session/cache-store.ts:58-80`:
  session persistence reads/writes/deletes the cache synchronously.
- `actionpack/src/action-controller/metal/rate-limiting.ts:147` already awaits
  `increment`.
- ~400 call sites in `packages/activesupport/src/cache/**` tests and behaviors.

`Notifications.instrument` already handles a Promise-returning block
(`notifications/instrumenter.ts:176`).

npm packages (optional peers, the `pg`/`mysql2` precedent in
`packages/activerecord/package.json`): a memcached client for
`Dalli::Client`, a Redis client for `Redis` / `Redis::Distributed`, and a pool
for `ConnectionPool` (candidates: `memjs`, `redis`/`ioredis`, `generic-pool`).
`ConnectionPool#then` is an alias of `#with`
(`connection_pool-3.0.2/lib/connection_pool.rb:60`), and a raw Redis answers
`Kernel#then` (`vendor/ruby/object.c:4339`). Rails' `redis.then { |c| }`
relies on both.

The six `CacheStoreSettingTest` mem_cache/redis cases
(`activesupport/test/cache/cache_store_setting_test.rb:30-86`) stay parked
under `cache-lookup-store-has-no-mem-cache-or-redis-store`, which is blocked
on this story. `UNIVERSAL_OPTIONS` cannot live in `cache.ts`: `cache.ts` must
import the stores for `lookupStore` registration and is the public
`@blazetrails/activesupport/cache` entry, so a class-body read of it TDZs
(verified in #8057). Host it in `cache/store.ts`.

This is multi-PR work. Split it into child stories: Store + Memory/File/Null
async; the actionview/actionpack consumers; MemCacheStore; RedisCacheStore.

## Acceptance criteria

- The cache Store API and the Memory/File/Null stores are async. Every
  consumer above is converted, or its sync path is explicitly decided.
- `MemCacheStore` and `RedisCacheStore` are ported async from the start, over
  npm clients declared as optional peers. There are no empty `TopLevel` seats.
- `lookupStore(":mem_cache_store" | ":redis_cache_store")` builds them, with
  a `.new` seam `assertCalledWith` can stub, and unblocks
  `cache-lookup-store-has-no-mem-cache-or-redis-store`.
