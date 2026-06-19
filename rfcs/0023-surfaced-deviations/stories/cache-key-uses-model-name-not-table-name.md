---
title: "cacheKey prefix should use model_name.cache_key, not tableName (integration.rb parity)"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-06-19T11:24:27Z"
assignee: "cache-key-uses-model-name-not-table-name"
blocked-by: null
---

## Context

`cacheKey()` in `packages/activerecord/src/integration.ts` (~110) builds the key
prefix from `klass.tableName`, e.g. `cache_me_with_versions/1`. Rails
(`vendor/rails/activerecord/lib/active_record/integration.rb:72-86`) uses
`model_name.cache_key`, the `ActiveModel::Name#cache_key` collection key
(underscored, namespaced), e.g. `active_record/cache_key_test/cache_me_with_versions/1`.

These coincide for simple top-level models whose table name equals the
underscored-pluralized model name, but diverge for namespaced models and models
with a custom/overridden `table_name`. Surfaced while converging
`cache-key.test.ts` (PR #3569): the faithful port had to assert the trails
`tableName`-based prefix instead of the Rails namespaced prefix.

## Acceptance criteria

- [ ] `cacheKey()` derives its prefix from `model_name.cache_key`
      (ActiveModel::Name) rather than `tableName`, matching integration.rb:72-86.
- [ ] Requires `ActiveModel::Name#cache_key` (underscored, pluralized,
      namespace-preserving) — implement/verify it exists.
- [ ] Update affected cacheKey assertions across AR tests to the namespaced
      prefix; keep test names unchanged.

## Definition of done

`cacheKey()`/`cacheKeyWithVersion()` prefixes match Rails `model_name.cache_key`
for namespaced and custom-table models.
