---
title: "port-the-last-cache-store-behavior-cases"
status: draft
updated: 2026-11-10
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

# Port the last 19 CacheStoreBehavior cases

## Context

`packages/activesupport/test/cache/behaviors/cache-store-behavior.ts` mirrors
`CacheStoreBehavior` (`vendor/rails/v8.0.2/activesupport/test/cache/behaviors/cache_store_behavior.rb:7`)
and now carries 48 of its 67 cases in Rails declaration order. Still unported:

- `test_fetch_with_dynamic_options` (:47) — `WriteOptions` round-trip of `expires_in` / `expires_at` / `version` (`packages/activesupport/lib/cache/store.ts` `WriteOptions`).
- `test_original_store_objects_should_not_be_immutable` (:456) — String mutation; likely PERMANENT-SKIP per root CLAUDE.md § "Ruby Strings are JS string primitives".
- `test_expires_in` (:463), `test_expires_at` (:492), `test_expire_in_is_alias_for_expires_in` (:510), `test_expired_in_is_alias_for_expires_in` (:528), `test_expires_in_and_expires_at` (:546), `test_expires_in_from_now_raises_an_error` (:580) — `Time.stub(:now, …)` ports as `travelTo` with a block (see "read multi with expires" in the helper).
- `test_race_condition_protection_skipped_if_not_defined` (:591) through `test_fetch_multi_race_condition_protection` (:670) — six cases.
- `test_absurd_key_characters` (:686), `test_really_long_keys` (:697).
- `test_cache_hit_instrumentation` (:706), `test_cache_miss_instrumentation` (:720), `test_setting_options_in_fetch_block_does_not_change_cache_options` (:734).

## Acceptance criteria

- `pnpm parity:test --package activesupport` reports 0 missing for `cache/behaviors/cache_store_behavior.rb`.
- Cases stay in Rails declaration order with Rails names; none ported by weakening assertions; a case needing unported store surface is filed, not stubbed.
