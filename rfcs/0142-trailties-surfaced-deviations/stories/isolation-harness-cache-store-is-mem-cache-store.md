---
title: "isolation-harness-cache-store-is-mem-cache-store"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
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

`vendor/rails/v8.0.2/railties/test/isolation/abstract_unit.rb:144` builds every
isolation app with `config.cache_store = :mem_cache_store`. trails' harness
(`packages/trailties/test/support/isolation/abstract-unit.ts`, `buildApp`)
writes `this.config.cacheStore = ":memory_store"` instead, because
`lookupStore` has no `MemCacheStore`. `MemoryStore` does not prepend
`Strategy::LocalCache`, so `Bootstrap`'s `initialize_cache`
(`railties/lib/rails/application/bootstrap.rb:84-86`) inserts no
`ActiveSupport::Cache::Strategy::LocalCache` middleware, and four tests in
`packages/trailties/test/commands/middleware.test.ts`
(`commands/middleware_test.rb`: "default middleware stack", "default middleware
stack when requests are local", "api middleware stack", "Rails.cache does
respond to middleware") are parked `BLOCKED:` on this story.

## Acceptance criteria

- [ ] `buildApp` sets `cacheStore = ":mem_cache_store"` as `abstract_unit.rb:144` does, once `MemCacheStore` is ported (dep `mem-cache-store-async-over-npm-client`).
- [ ] The four parked tests in `test/commands/middleware.test.ts` run and pass.
