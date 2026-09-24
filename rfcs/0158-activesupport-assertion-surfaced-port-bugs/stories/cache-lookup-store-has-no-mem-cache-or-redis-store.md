---
title: "cache-lookup-store-has-no-mem-cache-or-redis-store"
status: ready
updated: 2026-09-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
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

Surfaced by `assertions-activesupport-cache-xml-json-callbacks` (RFC 0132).
Parked tests in `packages/activesupport/src/cache/cache-store-setting.test.ts`
(`CacheStoreSettingTest`):

- `mem cache fragment cache store`
- `mem cache fragment cache store with not dalli client`
- `mem cache fragment cache store with multiple servers`
- `mem cache fragment cache store with options`
- `redis cache store with single array object`
- `redis cache store with ordered options`

Rails (`vendor/rails/activesupport/test/cache/cache_store_setting_test.rb:30-86`)
asserts `ActiveSupport::Cache.lookup_store :mem_cache_store, ...` builds an
`ActiveSupport::Cache::MemCacheStore` (with `assert_called_with(Dalli::Client,
:new, [servers, { compress: false, ... }])`, and `assert_raises(ArgumentError)`
for a non-Dalli client object), and that `:redis_cache_store` (as an array or
with `OrderedOptions`) builds an `ActiveSupport::Cache::RedisCacheStore` whose
`options[:namespace]` is `"foo"`.

trails has neither store: `packages/activesupport/src/cache/` ports only
`MemoryStore`, `FileStore` and `NullStore`, and `lookupStore(":mem_cache_store")`
raises `LoadError` from the store registry. The previous trails bodies
asserted against a `NullStore` / `MemoryStore` stand-in, which tested nothing
Rails tests. The six tests are parked with no body, since the classes and the
Dalli client seam they assert against do not exist to reference.

## Acceptance criteria

- `ActiveSupport::Cache::MemCacheStore` (`active_support/cache/mem_cache_store.rb`)
  and `RedisCacheStore` (`active_support/cache/redis_cache_store.rb`) are
  ported and registered for `lookupStore`, with a Dalli-client seam that
  `assertCalledWith` can stub.
- The six tests are written from the Rails bodies (same assertion count and
  kinds) and un-skipped.
