---
title: "test:compare credits solid_cache behavior modules run through shared ActiveSupport behaviors"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-cache"]
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-cache/test/solid-cache.test.ts` already runs ten of the shared ActiveSupport cache behaviors (`cacheStoreBehavior`, `localCacheBehavior`, `cacheStoreCompressionBehavior` and so on, imported from `@blazetrails/activesupport/test/cache/behaviors/*`), the way solid_cache's `test/unit/solid_cache_test.rb` includes them. `pnpm parity:test --package solid-cache` still shows every `vendor/solid_cache/v1.0.7/test/unit/behaviors/*.rb` file at 0 ported (`behaviors/<name>.test.ts` expected), for example `cache_store_behavior.rb` 0/66 and `local_cache_behavior.rb` 0/26. On 2026-11-16 the package reads 59/259 tests (22.8%), and most of the gap is behavior tests that already run.

## Acceptance criteria

- test-compare gives each solid_cache behavior module credit for the tests it runs through the shared ActiveSupport behavior functions called from `solid-cache.test.ts`, the same way activesupport's cache store tests get credit for them. Rails includes the module into the test class, and trails calls the function, so the credit follows that call.
- No test is copied into `packages/solid-cache/test/behaviors/` only to satisfy the counter.
- `parity:test --package solid-cache` goes up by the behavior tests that run, and no other package's number changes.
