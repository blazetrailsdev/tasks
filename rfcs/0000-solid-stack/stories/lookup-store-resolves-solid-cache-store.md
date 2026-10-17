---
title: "lookup_store(:solid_cache_store) resolves SolidCache::Store"
status: draft
updated: 2026-10-17
rfc: "0000-solid-stack"
cluster: solid-stack
packages: ["activesupport", "solid-cache"]
deps: ["port-solid-cache-entry-model-and-store"]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Cache.retrieve_store_class`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb`) does
`require "active_support/cache/#{store}"` and then `const_get`s the
camelized name. The gem supplies
`lib/active_support/cache/solid_cache_store.rb`, which defines
`ActiveSupport::Cache::SolidCacheStore = SolidCache::Store`.
`cache-lookup-store-has-no-mem-cache-or-redis-store` (RFC 0158) covers the
`:mem_cache_store` / `:redis_cache_store` arms, which are parked.

## Acceptance criteria

- `lookupStore("solid_cache_store", options)` returns a `SolidCache::Store`.
  The constant is seated on the `ActiveSupport.Cache` namespace through the
  call-time constant-resolution shape (CLAUDE.md), not through a hard import
  from activesupport into solid-cache.
- A `cache-store-setting` test for the solid arm, matching the Rails test that
  covers it if there is one.
