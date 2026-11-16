---
title: "test:compare credits solid_cache behavior modules run through shared ActiveSupport behaviors"
status: blocked
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-cache"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10202
claim: "2026-11-16T19:06:40Z"
assignee: "solid-cache-test-compare-credits-shared-behaviors"
blocked-by: "waiting on solid-cache-bump-to-v1-0-9: v1.0.7's local_cache_behavior.rb:217 fetch_multi is an older revision than the Rails 8.0.2 body (:228) the shared behavior ports; v1.0.9's behaviors_rails_8_0 copy matches"
closed-reason: null
---

## Context

`packages/solid-cache/test/solid-cache.test.ts` already runs ten of the shared ActiveSupport cache behaviors (`cacheStoreBehavior`, `localCacheBehavior`, `cacheStoreCompressionBehavior` and so on, imported from `@blazetrails/activesupport/test/cache/behaviors/*`), the way solid_cache's `test/unit/solid_cache_test.rb` includes them. `pnpm parity:test --package solid-cache` still shows every `vendor/solid_cache/v1.0.7/test/unit/behaviors/*.rb` file at 0 ported (`behaviors/<name>.test.ts` expected), for example `cache_store_behavior.rb` 0/66 and `local_cache_behavior.rb` 0/26. On 2026-11-16 the package reads 59/259 tests (22.8%), and most of the gap is behavior tests that already run.

## Acceptance criteria

- test-compare gives each solid_cache behavior module credit for the tests it runs through the shared ActiveSupport behavior functions called from `solid-cache.test.ts`, the same way activesupport's cache store tests get credit for them. Rails includes the module into the test class, and trails calls the function, so the credit follows that call.
- No test is copied into `packages/solid-cache/test/behaviors/` only to satisfy the counter.
- `parity:test --package solid-cache` goes up by the behavior tests that run, and no other package's number changes.
