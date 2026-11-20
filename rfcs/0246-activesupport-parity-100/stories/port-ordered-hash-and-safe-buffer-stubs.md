---
title: "port-ordered-hash-and-safe-buffer-stubs"
status: in-progress
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10394
claim: "2026-11-20T02:20:39Z"
assignee: "redis-cache-store-async-over-npm-client"
blocked-by: null
closed-reason: null
---

## Context

From the RFC 0105 reconciliation
(`reconcile-out-of-closure-activesupport-test-remainder`). The two largest
non-cache out-of-closure remainders, both pure `it.skip` stub burndowns with no
owner:

- `vendor/rails/activesupport/test/ordered_hash_test.rb:9`
  (`class OrderedHashTest`, 324 lines) — **8 stubs**. `ActiveSupport::OrderedHash`
  is a `Hash` subclass whose remaining cases are the `to_yaml` / `each_pair` /
  `select`-returns-an-OrderedHash arms.
- `vendor/rails/activesupport/test/safe_buffer_test.rb:7`
  (`class SafeBufferTest`, 312 lines) — **7 stubs**. `ActiveSupport::SafeBuffer`
  html-safety propagation across the remaining `String` operations.

Both implementations already exist in `packages/activesupport/src/`; this is
test porting, not new surface.

## Acceptance criteria

- All 15 stubs implemented; none left `it.skip`.
- Rails test names verbatim; a stub that cannot be implemented is converged, not
  re-justified — block the story with the specific blocker instead.
- `pnpm parity:test` deltas non-negative.
