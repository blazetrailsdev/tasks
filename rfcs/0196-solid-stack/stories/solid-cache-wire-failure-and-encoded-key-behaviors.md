---
title: "solid-cache-wire-failure-and-encoded-key-behaviors"
status: draft
updated: 2026-11-16
rfc: "0196-solid-stack"
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

`pnpm parity:test --package solid-cache` (2026-11-16, after trails#10202) shows these solid_cache v1.0.9 `test/unit/behaviors_rails_8_0/` modules at 0 ported: `failure_safety_behavior.rb` (13), `failure_raising_behavior.rb` (12), `connection_pool_behavior.rb` (2), `encoded_key_cache_behavior.rb` (2), `cache_delete_matched_behavior.rb` (1). solid_cache includes `EncodedKeyCacheBehavior` in `SolidCacheTest` (`test/unit/solid_cache_test.rb`). It includes `FailureSafetyBehavior` in `SolidCacheFailsafeTest` and `FailureRaisingBehavior` in `SolidCacheRaisingTest`, whose `emulating_unavailability` stubs `exec_query`, `internal_exec_query` and `exec_delete` to raise `ActiveRecord::StatementTimeout` and yields `lookup_store(namespace: @namespace)` (the raising test adds an `error_handler` that re-raises). `packages/solid-cache/test/solid-cache.test.ts` calls none of the matching shared activesupport behaviors. Related: `port-cache-failure-safety-and-failure-raising-behaviors`, `port-cache-connection-pool-and-encoded-key-behaviors`.

## Acceptance criteria

- `solid-cache.test.ts` calls `encodedKeyCacheBehavior`, and adds `SolidCacheFailsafeTest` / `SolidCacheRaisingTest` describes that call `failureSafetyBehavior` / `failureRaisingBehavior` with an `emulatingUnavailability` that mirrors the Rails stubs.
- Each module solid_cache includes is credited through test-compare's shared-behavior path, with no copies under `packages/solid-cache/test/behaviors/`.
