---
title: "solid-cache-local-cache-of-fetch-multi-rails-8-0-body"
status: in-progress
updated: 2026-11-17
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10242
claim: "2026-11-17T14:06:35Z"
assignee: "solid-cache-local-cache-of-fetch-multi-rails-8-0-body"
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-cache/test/solid-cache.test.ts` runs activesupport's shared `localCacheBehavior`. That behavior ports Rails 8.0.2's `test_local_cache_of_fetch_multi` (`vendor/rails/v8.0.2/activesupport/test/cache/behaviors/local_cache_behavior.rb:228`, 3 `assert_equal`). Under Rails 8.0, solid_cache v1.0.9's suite loads `test/unit/behaviors_rails_8_0/` (`test/unit/behaviors.rb`), and that copy's `local_cache_behavior.rb:217-227` is the older body: `fetch_multi(key, other_key) { true }`, then `@peek.delete` on both keys, then `assert_equal true, @cache.read(key)` and `assert_equal true, @cache.read(other_key)`. On the operator's ruling (trails#10202), test-compare does not credit the shared test to solid-cache (`UNCREDITED_SHARED_BEHAVIOR_TESTS` in `scripts/test-compare/compare.ts`).

## Acceptance criteria

- solid-cache runs solid_cache's Rails 8.0 `local cache of fetch multi` body, at its Rails name, in `packages/solid-cache/test/`.
- The `UNCREDITED_SHARED_BEHAVIOR_TESTS` row is removed, and the parity:test assertion counts match.
