---
title: "port-cache-lookup-store-for-cache-store-writer"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

`ActiveSupport::Cache.lookup_store(store = nil, *parameters)`
(`vendor/rails/activesupport/lib/active_support/cache.rb:85-97`) normalizes a
cache-store assignment: a Symbol is resolved through `retrieve_store_class` and
constructed with the remaining args, an Array is splatted back through
`lookup_store`, `nil` yields a `MemoryStore`, anything else is returned as-is.
`retrieve_store_class` lives just below it.

Neither is ported — `packages/activesupport/src/cache.ts` re-exports only
`Store`, its error classes and `WriteOptions`. Because of that,
`AbstractController::Caching::ConfigMethods#cache_store=`
(`packages/actionpack/src/abstract-controller/caching.ts`) assigns its raw
argument straight onto the class slot, so Rails-supported forms like
`self.cache_store = :file_store, path`
(`vendor/rails/actionpack/test/controller/caching_test.rb:36`) would leave a
non-store value in the slot and blow up later in `cache()` / the fragment
helpers, which call `fetch` / `read` / `write` on it.

## Acceptance criteria

- `lookupStore` and `retrieveStoreClass` ported to the Rails-layout file
  (`packages/activesupport/src/cache.ts`) with Rails' four-arm dispatch.
- `ConfigMethods`' `set cacheStore` routes assignments through `lookupStore`,
  so symbol / array / nil / store-object forms all land as a real store.
- Tests cover each dispatch arm, mirroring Rails' names.
