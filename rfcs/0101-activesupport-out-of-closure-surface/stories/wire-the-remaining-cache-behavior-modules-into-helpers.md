---
title: "give the remaining six cache behavior modules Rails-named helpers"
status: in-progress
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: 6469
claim: "2026-08-13T15:35:52Z"
assignee: "module-mixin-receiver-this-typed"
blocked-by: null
closed-reason: null
---

## Context

`memory_store_test.rb:16-24` and `file_store_test.rb:32-41` each include ten
behavior modules. PR #6453 wired four of them into the trails store tests
(`CacheStoreBehavior`, `CacheStoreCompressionBehavior`,
`CacheStoreSerializerBehavior`, `CacheInstrumentationBehavior`). The rest have
no helper at all, and `pnpm parity:test --package activesupport` reports each
as 0 matched:

| Rails module (test/cache/behaviors/)     | cases |
| ---------------------------------------- | ----- |
| `cache_store_version_behavior.rb`        | 12    |
| `cache_store_coder_behavior.rb`          | 7     |
| `cache_store_format_version_behavior.rb` | 8     |
| `cache_logging_behavior.rb`              | 8     |

`CacheDeleteMatchedBehavior` (1) and `CacheIncrementDecrementBehavior` (3) do
have helper files but are reported misplaced-adjacent: their cases sit in
`memory-store.test.ts` as file-level describes rather than as helper functions
the store test calls, which is the same shape PR #6444/#6453 converged for the
other four.

Some of the coder/version cases are already ported into
`memory-store.test.ts`'s `CacheStoreCoderBehavior`-named describe and into
`cache/cache-coder.test.ts`; those are relocations, not new ports.

## Converged shape

One helper per Rails module under
`packages/activesupport/src/cache/behaviors/`, exported as
`<moduleName>(host)` mirroring `cache-store-compression-behavior.ts`, called by
each including store test in Rails `include` order. Relocate the cases that are
already ported before writing new ones, so the misplacement is fixed in the same
move.

Splittable per module; `cache_store_coder_behavior.rb` is the smallest with
existing coverage to relocate.

## Acceptance criteria

- [ ] Each module above has a Rails-named helper called from every including
      store test, in Rails include order.
- [ ] `CacheDeleteMatchedBehavior` / `CacheIncrementDecrementBehavior` cases move
      out of `memory-store.test.ts` into their helpers.
- [ ] activesupport misplaced count stays 0 and matched rises by the cases moved
      or ported.
