---
title: "lookup_store(:solid_cache_store) resolves SolidCache::Store"
status: ready
updated: 2026-10-26
rfc: "0196-solid-stack"
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
priority: 4
---

## Context

`ActiveSupport::Cache.retrieve_store_class`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb`) does
`require "active_support/cache/#{store}"` and then `const_get`s the
camelized name. The gem supplies
`lib/active_support/cache/solid_cache_store.rb`, which defines
`ActiveSupport::Cache::SolidCacheStore = SolidCache::Store`.
RFC 0158's `cache-lookup-store-has-no-mem-cache-or-redis-store` covered the
`:mem_cache_store` / `:redis_cache_store` arms. Those stores are unported
(`SOLID_STACK_ONLY`, trails#9009), so this PR closes that story; its parked
tests stay skipped against the unported register. Only this story edits
`lookupStore`.

## Acceptance criteria

- `lookupStore("solid_cache_store", options)` returns a `SolidCache::Store`.
  The constant is seated on the `ActiveSupport.Cache` namespace through the
  call-time constant-resolution shape (CLAUDE.md), not through a hard import
  from activesupport into solid-cache.
- A `cache-store-setting` test for the solid arm, matching the Rails test that
  covers it if there is one.
