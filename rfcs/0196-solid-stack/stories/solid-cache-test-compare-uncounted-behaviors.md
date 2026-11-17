---
title: "solid-cache-test-compare-uncounted-behaviors"
status: done
updated: 2026-11-17
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10273
claim: "2026-11-17T21:52:33Z"
assignee: "solid-cache-test-compare-uncounted-behaviors"
blocked-by: null
closed-reason: null
---

## Context

After `solid-cache-store-behavior-missing-tests`, `pnpm parity:test --package solid-cache` stands at 259/265 (2 permanent skips). The last 4 missing are test-compare accounting, not unported behavior:

- `ttl is not updated` — solid_cache's copy (`vendor/solid_cache/v1.0.9/test/unit/behaviors_rails_8_0/cache_increment_decrement_behavior.rb:34`) renamed Rails' `test_ttl_isnt_updated` (`vendor/rails/v8.0.2/activesupport/test/cache/behaviors/cache_increment_decrement_behavior.rb:34`). The shared `packages/activesupport/test/cache/behaviors/cache-increment-decrement-behavior.ts` carries the Rails name, so solid-cache misses it.
- `connection pool` / `no connection pool` (`behaviors_rails_8_0/connection_pool_behavior.rb`) and `delete matched` (`behaviors_rails_8_0/cache_delete_matched_behavior.rb`): no solid_cache test class includes these modules (`test/unit/solid_cache_test.rb`), so the tests never run upstream, yet test-compare counts them.

## Acceptance criteria

- test-compare credits a shared behavior test whose name differs only between the Rails and gem copies, or matches by the including package's copy (design choice recorded in the PR).
- test-compare does not count a behavior module's tests in a package whose test classes never include it.
- parity:test solid-cache reaches 263/265 with 0 missing.
