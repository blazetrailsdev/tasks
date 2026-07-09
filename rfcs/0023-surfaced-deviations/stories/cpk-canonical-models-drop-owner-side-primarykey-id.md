---
title: 'Drop trails-only primaryKey:"id" from CPK owner-side has_many/has_one canonical models'
status: claimed
updated: 2026-07-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-09T11:29:34Z"
assignee: "cpk-canonical-models-drop-owner-side-primarykey-id"
blocked-by: null
closed-reason: null
---

## Context

PR #4747 removed the trails-only `primaryKey: "id"` annotations from
`Cpk::OrderTag` / `Cpk::OrderAgreement`'s `belongs_to :order` (Rails' models
omit them; `association_primary_key` infers "id" for a `[shop_id, id]` composite
PK on its own). Three sibling deviations remain in
`packages/activerecord/src/test-helpers/models/cpk.ts`:

- `CpkOrder.hasMany("orderAgreements", { …, primaryKey: "id" })` (cpk.ts:218-222)
- `CpkOrder.hasMany("orderTags", { …, primaryKey: "id" })` (cpk.ts:225-229)
- `CpkOrderWithPrimaryKeyAssociatedBook.hasOne("book", { …, primaryKey: "id" })`
  (cpk.ts:286)

Rails' canonical models omit `primary_key:` on all three
(`vendor/rails/activerecord/test/models/cpk/order.rb`:
`has_many :order_agreements`, `has_many :order_tags`, and
`OrderWithPrimaryKeyAssociatedBook has_one :book, foreign_key: :order_id`). The
owner-side has_many/has_one `active_record_primary_key` inference for a
composite-PK owner should resolve the "id" component without the explicit
annotation, exactly as the belongs_to side now does.

## Acceptance criteria

- Drop the `primaryKey: "id"` option from the three associations above so the
  canonical models match Rails verbatim.
- The has_many/has_one owner-side key inference resolves the composite-PK "id"
  component on its own (extend the reflection inference if it does not).
- No regressions across the cpk-referencing suites (associations,
  has-many/has-one-through, eager, autosave, persistence, batches, cpk relation
  suites, use-fixtures). No test renames.
