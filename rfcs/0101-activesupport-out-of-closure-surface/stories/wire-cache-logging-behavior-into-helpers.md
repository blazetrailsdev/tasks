---
title: "wire-cache-logging-behavior-into-helpers"
status: ready
updated: 2026-08-13
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

Split out of `wire-the-remaining-cache-behavior-modules-into-helpers` (RFC 0101),
which shipped only the coder module plus the two relocations under the PR LOC
ceiling.

`vendor/rails/activesupport/test/cache/behaviors/cache_logging_behavior.rb`
(83 lines, 8 cases) has no trails helper: `pnpm parity:test --package
activesupport` reports
`cache/behaviors/cache_logging_behavior.rb → cache/behaviors/cache-logging-behavior.ts  0 matched, 8 missing ✗`.

Rails includes it from both store tests:

- `test/cache/stores/memory_store_test.rb:24` (`include CacheLoggingBehavior`)
- `test/cache/stores/file_store_test.rb:41`

## Converged shape

One helper at `packages/activesupport/src/cache/behaviors/cache-logging-behavior.ts`,
exported as `cacheLoggingBehavior(host)` mirroring
`cache-store-coder-behavior.ts` (shipped in this campaign), called from
`packages/activesupport/src/cache/stores/memory-store.test.ts` and
`.../file-store.test.ts` inside each store's own `describe`, in Rails
`include` order.

Test names follow the `def test_x_y` → `it("x y")` mapping the compare tool
matches on — see the sibling helpers.

## Acceptance criteria

- [ ] `cacheLoggingBehavior` helper exists and is called from both store tests.
- [ ] `pnpm parity:test --package activesupport` shows the file 8/8 ✓ and the
      activesupport matched count up by the cases ported.
- [ ] activesupport misplaced count stays 0.
