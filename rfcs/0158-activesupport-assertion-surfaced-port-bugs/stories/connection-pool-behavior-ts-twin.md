---
title: "Port ConnectionPoolBehavior as a shared TS behavior and enroll it in REQUIRED_TEST_MODULES"
status: draft
updated: 2026-11-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10244 enrolled activesupport's cache `behaviors/` modules in `REQUIRED_TEST_MODULES` (`scripts/test-compare/extract-ruby-tests.rb`) and in the TS twin table in `scripts/test-compare/extract-ts-core.ts`. `ConnectionPoolBehavior` (`vendor/rails/v8.0.2/activesupport/test/cache/behaviors/connection_pool_behavior.rb`) was left out of both because it has no TS twin: `packages/activesupport/test/cache/stores/redis-cache-store.test.ts:48` ports its tests inline. Rails includes it from `stores/mem_cache_store_test.rb` and `stores/redis_cache_store_test.rb`.

## Acceptance criteria

- `packages/activesupport/test/cache/behaviors/connection-pool-behavior.ts` exports `connectionPoolBehavior(host)` with the Rails test names, and the redis and memcache store tests call it.
- `ConnectionPoolBehavior` is added to `REQUIRED_TEST_MODULES`, and `connectionPoolBehavior` is added to the TS twin table.
- activesupport's `parity:test` matched count does not drop, and `parity:test:assertions` stays at or below base.
