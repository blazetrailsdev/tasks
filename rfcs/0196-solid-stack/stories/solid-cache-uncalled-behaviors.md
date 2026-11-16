---
title: "Run solid_cache's failure-safety, failure-raising, connection-pool, encoded-key and delete-matched behaviors"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-cache", "activesupport"]
deps: ["solid-cache-test-compare-credits-shared-behaviors"]
deps-rfc: []
est-loc: 400
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

solid_cache's `test/unit/solid_cache_test.rb` (`vendor/solid_cache/v1.0.7/test/unit/`) includes behavior modules that `packages/solid-cache/test/solid-cache.test.ts` does not call yet: `FailureSafetyBehavior` (13), `FailureRaisingBehavior` (12), `ConnectionPoolBehavior` (2), `EncodedKeyCacheBehavior` (2) and `CacheDeleteMatchedBehavior` (1). Some of them, for example `failure_safety_behavior.rb` and `failure_raising_behavior.rb`, may have no ActiveSupport counterpart under `packages/activesupport/test/cache/behaviors/` yet.

## Acceptance criteria

- Each missing behavior is ported once, at its Rails file name, under `packages/activesupport/test/cache/behaviors/` from `vendor/rails/v8.0.2/activesupport/test/cache/behaviors/`. A version that already exists there is reused.
- `solid-cache.test.ts` includes each one in the order `solid_cache_test.rb` uses. The emulated failures follow solid_cache's own `emulating_unavailability` / `emulating_failures` helpers.
- The ported tests pass on SQLite, PostgreSQL and MariaDB.
