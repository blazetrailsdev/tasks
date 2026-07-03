---
title: "defineFixtures seeds model composite-PK columns (shop_id) like Rails composite_identify"
status: done
updated: 2026-07-03
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4364
claim: "2026-07-03T00:57:52Z"
assignee: "fixtures-seed-composite-pk-columns-single-id-table"
blocked-by: null
---

## Context

Rails `ActiveRecord::FixtureSet.composite_identify` seeds EVERY column of a
model's `primary_key` from the fixture label. For `Cpk::Order` (model
`self.primary_key = [:shop_id, :id]`, but the table keeps a plain autoincrement
`id`), Rails seeds BOTH `shop_id` and `id`, so `cpk_orders(:...).id` is
`[hash, hash]` with no NULL component.

trails' `defineFixtures` (packages/activerecord/src/test-helpers/define-fixtures.ts:577-598)
deliberately defers to the schema's single `id` when a model declares a
composite PK over a single-id table, so the extra key column (`shop_id`) is
never seeded and stays NULL — `cpkOrders(...).id` is `[null, n]`. While porting
`counter_cache_test.rb` (CPK counter tests) this forced a workaround in
`buildPkPredicate` (packages/activerecord/src/counter-cache.ts): a null
composite component is rendered as `IS NULL` so the counter UPDATE still matches
the row. That is correct Rails Arel behavior, but the underlying fixture
divergence (shop_id NULL vs Rails' seeded value) remains.

Converging — seeding the extra composite-PK columns via `compositeIdentify`
(an earlier attempt in this PR did exactly this) — is currently blocked: a
non-null `shop_id` flows a BigInt composite-key value through `JSON.stringify`
and trips "Do not know how to serialize a BigInt" in the has_many:through /
belongs_to stale-state path, regressing
`has-many-through-associations.test.ts > composite PK through associations >
destroy all on composite primary key model`. That serialize bug is tracked by
`pg-bigint-belongs-to-stalestate-composite-key-serialize` (RFC 0030).

## Acceptance criteria

- [ ] `defineFixtures` seeds a model's extra composite-PK columns (e.g.
      `CpkOrder.shop_id`) via `compositeIdentify` when the table keeps a single
      autoincrement `id`, matching Rails `composite_identify`; `cpkOrders(...).id`
      no longer contains a NULL component.
- [ ] No regression in has_many:through / belongs_to composite-key paths
      (depends on `pg-bigint-belongs-to-stalestate-composite-key-serialize`
      landing first; normalize BigInt before JSON.stringify).
- [ ] Re-assess / remove the `buildPkPredicate` null-component `IS NULL` branch
      in counter-cache.ts once fixtures seed `shop_id`.
