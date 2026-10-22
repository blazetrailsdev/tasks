---
title: "Relation as a fragment cache name expands its async cache_key"
status: in-progress
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9238
claim: "2026-10-22T17:45:29Z"
assignee: "build-views-precompiles-builder-templates"
blocked-by: null
closed-reason: null
---

## Context

`RelationCacheTest#test_cache_relation_other`
(`vendor/rails/v8.0.2/actionview/test/activerecord/relation_cache_test.rb:21-26`)
calls `cache(Project.all) { concat("Hello World") }` from an `ActionView::TestCase`.
The fragment name reaches `ActiveSupport::Cache.retrieve_cache_key`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:123-131`), which
calls `key.cache_key_with_version` / `key.cache_key` synchronously. trails'
`Relation#cacheKey` (`packages/activerecord/src/relation.ts:1560`) is `async`,
because `collection_cache_key` runs a query. So the key is written as
`views/test/hello_world:<digest>/[object Promise]`. Rails writes `projects-<count>`.

The test is ported in `packages/actionview/src/activerecord/relation-cache.test.ts`
and is `it.skip` behind this story. The rest of its setup runs: TestCase,
`tests CacheHelper`, view renderer, and MemoryStore.

## Acceptance criteria

- A relation used as a fragment-cache name expands to its resolved
  `cache_key_with_version` (`relation.rb:438-441`). Do this by awaiting it on
  `CacheHelper#cache`'s path, or by prewarming it, and follow the repo's settled
  async-reader shape. Do not add a send or a new stringification arm.
- `RelationCacheTest > cache relation other` is un-skipped and passes on SQLite.
