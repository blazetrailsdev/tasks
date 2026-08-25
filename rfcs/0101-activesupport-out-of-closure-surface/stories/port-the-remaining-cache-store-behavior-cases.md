---
title: "port the remaining 42 CacheStoreBehavior cases into the behavior helper"
status: ready
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6453 created `packages/activesupport/src/cache/behaviors/cache-store-behavior.ts`
as the Rails-named helper for `CacheStoreBehavior`
(`activesupport/test/cache/behaviors/cache_store_behavior.rb:7`), called by
`memory-store.test.ts` (memory_store_test.rb:16) and `file-store.test.ts`
(file_store_test.rb:32). It carries 25 of the module's 67 cases;
`pnpm parity:test --package activesupport` reports the other 42 as missing
against that file.

The unported cases are the ones needing surface the helper does not have today,
notably:

- `test_fetch_with_cache_miss_passes_key_to_block` (:35) and
  `test_fetch_with_dynamic_options` (:46) — the block's second argument is a
  mutable `WriteOptions`; trails has `WriteOptions` (cache/store.ts) but the
  case asserts `expires_in`/`expires_at`/`version` round-trips through it.
- `test_read_multi_with_expires` (:152) and the other time-travelling cases —
  Ruby `Time.stub(:now, time + 11)`.
- `test_fetch_multi_with_objects` (:216) — `cache_key`-bearing objects as names.
- the `test_race_condition_protection*` block, the version/expiry cases, and the
  `:coder`/`:raw` cases further down the file.

## Converged shape

Port the remaining cases into the existing helper, in Rails declaration order
(the helper already preserves it), so `cache_store_behavior.rb` reaches 67/67
and every store test that calls the helper gains them at once. Split across PRs
by contiguous run of Rails cases rather than by store.

## Acceptance criteria

- [ ] `pnpm parity:test --package activesupport` reports 0 missing for
      `cache/behaviors/cache_store_behavior.rb`.
- [ ] Cases stay in Rails declaration order and keep Rails names verbatim.
- [ ] No case is ported by weakening its assertions; a case needing unported
      store surface is filed rather than stubbed.
