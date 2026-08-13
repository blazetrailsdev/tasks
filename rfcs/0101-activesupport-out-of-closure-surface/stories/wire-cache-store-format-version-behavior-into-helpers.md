---
title: "wire-cache-store-format-version-behavior-into-helpers"
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

`vendor/rails/activesupport/test/cache/behaviors/cache_store_format_version_behavior.rb`
(122 lines, 8 cases) has no trails helper: `pnpm parity:test --package
activesupport` reports
`cache/behaviors/cache_store_format_version_behavior.rb → cache/behaviors/cache-store-format-version-behavior.ts  0 matched, 8 missing ✗`.

Rails includes it from one store test only:

- `test/cache/stores/file_store_test.rb:37` (`include CacheStoreFormatVersionBehavior`)

## Converged shape

One helper at `packages/activesupport/src/cache/behaviors/cache-store-format-version-behavior.ts`,
exported as `cacheStoreFormatVersionBehavior(host)` mirroring
`cache-store-coder-behavior.ts` (shipped in this campaign), called from
`packages/activesupport/src/cache/stores/file-store.test.ts` inside the store's
own `describe`, in Rails `include` order.

Test names follow the `def test_x_y` → `it("x y")` mapping the compare tool
matches on — see the sibling helpers.

## Acceptance criteria

- [ ] `cacheStoreFormatVersionBehavior` helper exists and is called from file-store.test.ts.
- [ ] `pnpm parity:test --package activesupport` shows the file 8/8 ✓ and the
      activesupport matched count up by the cases ported.
- [ ] activesupport misplaced count stays 0.
