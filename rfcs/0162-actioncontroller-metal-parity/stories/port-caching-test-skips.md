---
title: "Port caching_test.rb's 32 skipped fragment and collection caching tests"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-view-and-helper-test-fixtures",
    "abstract-controller-class-attributes-and-helper-resolution",
    "cache-store-async-over-npm-clients",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/caching_test.rb` matches all 32
tests by name, and all 32 are empty `it.skip` stubs in
`packages/actionpack/src/action-controller/controller/caching.test.ts`
(from `:246`):

- `FragmentCachingTest` (`:63-143`), 12 — `write_fragment`, `read_fragment`,
  `fragment_exist?`, `expire_fragment`, `combined_fragment_cache_key`
- `FunctionalFragmentCachingTest` (`:204-308`), 10 — `cache do … end` in views
  from `fixtures/functional_caching`
- `CacheHelperOutputBufferTest` (`:334`), 1
- `ViewCacheDependencyTest` (`:363-367`), 2 — `view_cache_dependency`
- `CollectionCacheTest` (`:410-443`), 5 — `render partial:, collection:, cached: true`
- `FragmentCacheKeyTest` (`:465-473`), 2 — `fragment_cache_key`

Three more tests (`output buffer`, `caching works with beginning comment`,
`caching with callable cache key`) sit under `FunctionalFragmentCachingTest`
in trails where Rails has them under `CacheHelperOutputBufferTest` and
`CollectionCacheTest`.

The fragment-cache paths read and write an `ActiveSupport::Cache` store, whose
async surface is `cache-store-async-over-npm-clients` (RFC 0158).

## Acceptance criteria

- The 32 stubs are real tests with Rails' bodies, under the Rails classes; the
  three wrong-describe tests move.
- `pnpm parity:test --package actioncontroller` reports the file 32/32 with 0
  skipped and 0 wrong describe.
