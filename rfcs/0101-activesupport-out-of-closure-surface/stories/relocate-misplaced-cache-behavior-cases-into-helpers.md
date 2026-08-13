---
title: "Move ported cache-behavior cases out of store test files into their Rails-named helpers"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6453
claim: "2026-08-13T02:36:50Z"
assignee: "converge-nokogiri-parse-onto-the-stringio-shim"
blocked-by: null
closed-reason: null
---

## Context

PR #6444 taught `parity:test` to scan Rails' shared test-behavior mixins
(`vendor/rails/activesupport/test/cache/behaviors/*_behavior.rb`) and to map
them onto `packages/<pkg>/src/**/behaviors/<name>-behavior.ts`. That made a
previously invisible class of misplacement visible: ported cases of a Rails
behavior MODULE that live in an including store's test file, or in a bespoke
file, instead of in the behavior helper. They are reported as `misplaced`, which
credits nothing — `parity:test --package activesupport` currently reads 10:

| ported cases live in                       | Rails behavior module                |
| ------------------------------------------ | ------------------------------------ |
| `cache/cache-store-base.test.ts` (6)       | `cache_store_behavior.rb`            |
| `cache/stores/memory-store.test.ts` (3)    | `cache_store_serializer_behavior.rb` |
| `cache/stores/mem-cache-store.test.ts` (1) | `local_cache_behavior.rb`            |

The named cases are listed in the tool's own "moves summary" — run
`pnpm parity:test --package activesupport` and read the `→` lines.

This is the same shape the mixin is: Ruby's `include CacheStoreBehavior` runs
the module's cases once per including class, and the trails spelling
(established by `cache-store-compression-behavior.ts`) is a `this`-free helper
function the store test calls inside its own describe. A case ported into one
store's test file only credits that store and cannot be shared.

`cache/cache-store-base.test.ts` is additionally a bespoke file name with no
Rails counterpart — `cache_store_behavior.rb` is the Rails file, so the helper
belongs at `cache/behaviors/cache-store-behavior.ts`.

## Converged shape

Each of the three groups moves into its Rails-named behavior helper under
`packages/activesupport/src/cache/behaviors/`, exported as a
`cacheStoreBehavior(host)` / `cacheStoreSerializerBehavior(host)` /
`localCacheBehavior(host)` function that every including store test calls —
mirroring `cache-store-compression-behavior.ts` and its FileStore/MemoryStore
call sites. `parity:test --package activesupport` then reports 0 misplaced for
these files and credits the cases against their Rails modules.

Splittable per behavior module if one PR is too large; take
`cache_store_serializer_behavior.rb` (3 cases) first as the smallest.

## Acceptance criteria

- [ ] The three groups above live in Rails-named behavior helpers under
      `cache/behaviors/`, called by each including store test.
- [ ] `pnpm parity:test --package activesupport` misplaced count drops by the
      cases moved; matched rises correspondingly.
- [ ] `cache/cache-store-base.test.ts` (bespoke, no Rails counterpart) is gone.
