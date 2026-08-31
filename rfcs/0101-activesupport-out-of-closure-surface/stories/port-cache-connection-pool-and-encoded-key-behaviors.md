---
title: "port-cache-connection-pool-and-encoded-key-behaviors"
status: draft
updated: 2026-08-31
rfc: "0101-activesupport-out-of-closure-surface"
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

From the RFC 0105 reconciliation
(`reconcile-out-of-closure-activesupport-test-remainder`): two small cache
behavior modules with no RFC 0101 owner.

- `vendor/rails/activesupport/test/cache/behaviors/connection_pool_behavior.rb:3`
  (`module ConnectionPoolBehavior`, 85 lines) — **3 cases missing**. Asserts a
  store built with `pool: { size:, timeout: }` checks connections out of a
  `ConnectionPool` and that `pool: false` opts out.
- `vendor/rails/activesupport/test/cache/behaviors/encoded_key_cache_behavior.rb:6`
  (`module EncodedKeyCacheBehavior`, 36 lines) — **2 cases missing**. Asserts a
  key longer than the store's key limit is truncated-and-digested rather than
  passed through.

Land them as Rails-named helper modules beside the ones already ported under
`packages/activesupport/src/cache/behaviors/`, called from the store tests that
Rails calls them from.

## Acceptance criteria

- `cache-connection-pool-behavior.ts` and `encoded-key-cache-behavior.ts` under
  `packages/activesupport/src/cache/behaviors/`, mirroring the Ruby modules.
- Rails test names verbatim.
- `pnpm parity:test` credits the 5 cases; deltas non-negative.
