---
title: "cpk-composite-fixture-ref-resolution"
status: ready
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails keeps the `cpk_orders` **table** on a plain autoincrement `id` (`activerecord/test/schema/schema.rb:282-284`) and declares the composite PK only on the **model** (`activerecord/test/models/cpk/order.rb:4-8`: `self.primary_key = [:shop_id, :id]`). Its fixtures (`activerecord/test/fixtures/cpk_orders.yml`) omit `shop_id` — `ActiveRecord::FixtureSet.composite_identify` (`activerecord/lib/active_record/fixture_set/table_row.rb:86-90,127-133`), keyed on `model_class.composite_primary_key?`, fills it from the label. So trails' single-`id` `cpk_orders` schema already matches Rails' table; the deviation is only in fixture loading.

trails' loader keys the composite fill on the SCHEMA pk (not `model_class.composite_primary_key?`), so it never fills `shop_id`; `packages/activerecord/src/test-helpers/fixtures/cpk-orders.ts` pins `shop_id` as a bridge. Two options for full convergence:

1. Key the composite fill on the model's `composite_primary_key?` like Rails, so `shop_id` is label-derived even for a single-`id` table (preferred — smallest, most faithful).
2. Make the schema composite-PK. This is blocked: `defineFixtures` cannot resolve a `ref()` to a specific column of a composite-PK target — composite-PK tables are deliberately left unregistered as `ref()` targets (`packages/activerecord/src/test-helpers/define-fixtures.ts:633-635`) — so `cpk_order_agreements.order_id = ref("cpk_orders", "cpk_groceries_order_2")` resolves via single-column `identify(label)`, which no longer equals the row's `id` (`compositeIdentify(label)["id"] = identify << 1`).

### What already shipped in PR #4364

Option 1 (partial) landed: the loader now fills the model's **non-schema-PK** composite columns (`shop_id`) label-derived, keyed on the model's composite PK — so `cpk_orders.yml` no longer pins `shop_id`. What remains (flagged by Copilot review #8 on #4364) is FULL `composite_identify` parity: the schema-PK `id` is still seeded as the single-PK `identify(label)` instead of Rails' `composite_identify(label, [:shop_id, :id])[:id] = identify(label) << 1`. It is left unshifted because `ref()` targets resolve to `identify(label)` and composite-PK tables are unregistered as `ref()` targets (`define-fixtures.ts:633-635`), so shifting `id` would desync `cpk_order_agreements.order_id`.

## Acceptance criteria

- `defineFixtures` resolves a belongs_to `ref()`/association-label to the correct column of a composite-PK (or composite-model-PK) target, honoring the association's `primaryKey` (e.g. `cpk_order_agreements.order`/`order_id` → the order's `id` column) — the prerequisite that unblocks shifting `id`.
- With that in place, the composite-model-PK fill seeds `id = identify(label) << index` (full Rails `composite_identify` parity), not the single-PK `identify(label)`.
- The delete-all/update-all "composite model with join subquery" tests still pass.
- No regression in cpk belongs-to / has-many-through / inverse / use-fixtures suites.
