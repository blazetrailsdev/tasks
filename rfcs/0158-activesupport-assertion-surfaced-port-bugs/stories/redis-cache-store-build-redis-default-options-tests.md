---
title: "Port the four RedisCacheStore Redis.new default-options tests"
status: draft
updated: 2026-11-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/test/cache/stores/redis-cache-store.test.ts` parks four `RedisCacheStore` construction tests as `it.skip`: "omitted URL uses Redis client with default settings", "no URLs uses Redis client with default settings", "singular URL uses Redis client" and "one URL uses Redis client" (`vendor/rails/v8.0.5.2/activesupport/test/cache/stores/redis_cache_store_test.rb:47-79`). Each one asserts `assert_called_with Redis, :new, [connect_timeout: 1, read_timeout: 1, write_timeout: 1 (, url: …)]`. The Rails body is `build_redis` → `::Redis.new(DEFAULT_REDIS_OPTIONS.merge(redis_options))` (`activesupport/lib/active_support/cache/redis_cache_store.rb:~100-110`). The fifth test, "multiple URLs uses Redis::Distributed client", belongs to `redis-cache-store-distributed-client`.

## Acceptance criteria

- The four tests are ported with `vi.spyOn` on the client constructor that `build_redis` calls, asserting the exact option hash Rails asserts, translated through ioredis option names only where the store already maps them. If the store passes a different hash, fix the store.
- `parity:test --assertions` shows no regression, and the four rows leave the skipped count.
