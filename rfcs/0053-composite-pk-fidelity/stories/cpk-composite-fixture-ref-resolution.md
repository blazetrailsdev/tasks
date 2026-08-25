---
title: "cpk-composite-fixture-ref-resolution"
status: done
updated: 2026-07-01
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4369
claim: "2026-07-01T11:24:48Z"
assignee: "cpk-composite-fixture-ref-resolution"
blocked-by: null
---

## Context

Rails' `cpk_orders` table is composite-PK `[shop_id, id]` (`activerecord/test/schema/schema.rb`), and its fixtures (`activerecord/test/fixtures/cpk_orders.yml`) omit both key columns — `ActiveRecord::FixtureSet.composite_identify` (`activerecord/lib/active_record/fixture_set/table_row.rb:86-90,127-133`) generates them from the label.

trails keeps `cpk_orders` on a single autoincrement `id` (`packages/activerecord/src/test-helpers/test-schema.ts`) and pins `shop_id` values in `cpk-orders.ts` fixtures as a bridge. The blocker for full convergence: `defineFixtures` cannot resolve a `ref()` to a specific column of a composite-PK target — composite-PK tables are deliberately left unregistered as `ref()` targets (`packages/activerecord/src/test-helpers/define-fixtures.ts:633-635`). So `cpk_order_agreements.order_id = ref("cpk_orders", "cpk_groceries_order_2")` resolves via single-column `identify(label)`, which no longer equals the row's `id` (`compositeIdentify(label)["id"] = identify << 1`) once the table is composite.

Surfaced in PR #4364 (cpk-join-dependency-composite-pk-single-fk): converting the schema to composite-PK made the JoinDependency delete/update join tests fail on FK mismatch, so the pinned-shop_id bridge was kept.

## Acceptance criteria

- `cpk_orders` test schema declares composite `primaryKey: ["shop_id", "id"]` (mirrors Rails schema.rb).
- `cpk_orders.yml` fixtures omit `shop_id`/`id`; the loader fills both via `compositeIdentify` (mirrors Rails).
- `defineFixtures` resolves a belongs_to `ref()`/association-label to the correct column of a composite-PK target, honoring the association's `primaryKey` (e.g. `cpk_order_agreements.order`/`order_id` → the order's `id` column).
- The delete-all/update-all "composite model with join subquery" tests still pass with the pinned shop_id values removed.
- No regression in cpk belongs-to / has-many-through / inverse / use-fixtures suites.
