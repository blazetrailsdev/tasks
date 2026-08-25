---
title: "delete-bespoke-cache-store-base-test-file"
status: closed
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
closed-reason: "Superseded: PR #6453 deleted the bespoke file in its review round — the instrumentation cases became cache/behaviors/cache-instrumentation-behavior.ts (10/10), the namespace describe was a duplicate of the already-matched cache/cache-store-namespace.test.ts, and the TS-only event cases moved to cache/store-instrumentation.trails.test.ts."
---

## Context

`packages/activesupport/src/cache-store-base.test.ts` is a bespoke test file
with no Rails counterpart (`parity:test` credits nothing in it). The PR for
[[relocate-misplaced-cache-behavior-cases-into-helpers]] moved its six
`CacheStoreBehavior` cases into `cache/behaviors/cache-store-behavior.ts` and
drove the activesupport misplaced count to 0, but stopped short of deleting the
file: what is left is

- a `CacheBehaviorTest` remnant against the file-local abstract-`Store`
  subclass `TestStore` (`delete`, `increment`, `decrement`, `fetch with block
receiving write options`),
- a `CacheStoreNamespaceTest` describe that duplicates the scope of
  `cache/cache-store-namespace.test.ts` (which already matches
  `cache/cache_store_namespace_test.rb`, 4/4),
- two `CacheInstrumentationBehavior` describes (~200 lines) whose case names are
  spelled `test_read_instrumentation` rather than the `def_test` form
  `parity:test` matches (`read instrumentation`), so
  `cache/behaviors/cache_instrumentation_behavior.rb` still reads 0 matched /
  10 missing.

Splitting it out kept that PR inside its LOC ceiling — a pure move of the
instrumentation block alone is ~400 counted LOC.

## Converged shape

- The instrumentation describes move to
  `packages/activesupport/src/cache/behaviors/cache-instrumentation-behavior.ts`
  as a `cacheInstrumentationBehavior(host)` function mirroring
  `cache-store-compression-behavior.ts`, called from the store tests that
  `include CacheInstrumentationBehavior` (memory_store_test.rb:23,
  file_store_test.rb). Case names take the `def_test` spelling so they credit
  against the Rails module.
- The namespace cases fold into `cache/cache-store-namespace.test.ts`.
- The `TestStore` remnant folds into whichever ported store test covers it, or
  is dropped where the behavior helper already covers it.
- `packages/activesupport/src/cache-store-base.test.ts` is deleted.

## Acceptance criteria

- [ ] `packages/activesupport/src/cache-store-base.test.ts` no longer exists.
- [ ] `cache/behaviors/cache_instrumentation_behavior.rb` reports matched > 0 in
      `pnpm parity:test --package activesupport`.
- [ ] activesupport misplaced count stays 0 and matched does not regress.
