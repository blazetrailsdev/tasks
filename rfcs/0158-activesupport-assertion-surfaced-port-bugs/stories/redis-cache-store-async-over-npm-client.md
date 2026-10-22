---
title: "redis-cache-store-async-over-npm-client"
status: draft
updated: 2026-10-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: ["cache-store-async-store-and-local-stores"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `cache-store-async-over-npm-clients`. Port `RedisCacheStore` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/redis_cache_store.rb`) async from the start, over an npm Redis client (`redis` or `ioredis`) and a pool (`generic-pool`) for `ConnectionPool`. Declare them as optional peers, following the `pg`/`mysql2` precedent in `packages/activerecord/package.json`. `ConnectionPool#then` is an alias of `#with` (`connection_pool-3.0.2/lib/connection_pool.rb:60`), and a raw Redis answers `Kernel#then` (`vendor/ruby/v3.3.11/object.c:4339`). Rails' `redis.then { |c| }` relies on both. No empty `TopLevel` seats (trails#8057 was closed for that). Register it in `lookupStore` (`cache.rb:85-97`) with a `.new` seam `assertCalledWith` can stub, and unpark the redis cases of `CacheStoreSettingTest` (`activesupport/test/cache/cache_store_setting_test.rb:30-86`).

## Acceptance criteria

- `RedisCacheStore` is ported async over npm peers, and `lookupStore(":redis_cache_store")` builds it.
- The redis `CacheStoreSettingTest` cases run.
