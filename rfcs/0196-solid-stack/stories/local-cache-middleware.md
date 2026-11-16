---
title: "local-cache-middleware"
status: done
updated: 2026-11-15
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10150
claim: "2026-11-15T20:21:41Z"
assignee: "local-cache-middleware"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Cache::Strategy::LocalCache::Middleware` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/strategy/local_cache_middleware.rb`) and `LocalCache#middleware` (`local_cache.rb:72-76`) are unported; `packages/activesupport/lib/cache/strategy/local-cache.ts` (trails#10134) ports the rest of the strategy. `LocalCacheBehavior`'s "middleware" test (`local_cache_behavior.rb:338-349`) stays `it.skip` in `packages/activesupport/test/cache/behaviors/local-cache-behavior.ts`.

## Acceptance criteria

- `Middleware` ported at `lib/cache/strategy/local-cache-middleware.ts`; `LocalCache.middleware` added.
- "middleware" test runs against SolidCache::Store.
