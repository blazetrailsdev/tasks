---
title: "fk-test-pair-columns-are-integer-not-bigint"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6184
claim: "2026-08-07T17:13:47Z"
assignee: "fk-test-pair-columns-are-integer-not-bigint"
blocked-by: null
closed-reason: null
---

## Context

`schema.rb:1389-1394` declares the fk_test pair as

```ruby
create_table :fk_test_has_pk, primary_key: "pk_id", force: :cascade do |t|
end

create_table :fk_test_has_fk, force: true do |t|
  t.references :fk, null: false
  t.foreign_key :fk_test_has_pk, column: "fk_id", name: "fk_name", primary_key: "pk_id"
end
```

`primary_key: "pk_id"` is a **bigint** primary key and `t.references :fk` is a
**bigint** column. Both canonical schema sources spell them `integer` instead:

- `packages/activerecord/src/support/canonical-schema.ts:1736-1743` —
  `t.integer("pk_id", { null: false })` and `t.integer("fk_id", { null: false })`
- `packages/activerecord/src/test-helpers/test-schema.ts` — `fk_test_has_pk` /
  `fk_test_has_fk`, same two columns

The two divergences cancel — an integer FK against an integer PK is a valid
constraint — so no lane is red today. That is the whole reason it has survived:
the pair is only self-consistent, not Rails-consistent.

Found while adding `fk_that_will_be_broken` to
`fk_pointing_to_non_existent_objects` (PR #6177, story
`wire-check-all-foreign-keys-valid-into-fixture-load`). That table has the same
`t.integer`-for-`t.references` divergence, but its target is an ordinary bigint
`id`, so nothing cancelled and the MariaDB lane raised
`MismatchedForeignKey: Column 'fk_object_to_point_to_id' ... does not match
column 'id' on 'fk_object_to_point_tos', which has type 'bigint(20)'`. That one
is fixed in #6177; this sibling pair is not, and is out of that PR's scope.

Also note `t.references` builds an index by default — `fk_pointing_to_non_existent_objects`
passes `index: false` explicitly (schema.rb:1403) while `fk_test_has_fk` does
not, so `fk_test_has_fk` should carry an index on `fk_id` that neither schema
source declares. Worth confirming while the columns are being widened.

## Acceptance criteria

- [ ] `fk_test_has_pk.pk_id` is a bigint primary key in both
      `canonical-schema.ts` and `test-schema.ts`, matching
      `primary_key: "pk_id"` (schema.rb:1389).
- [ ] `fk_test_has_fk.fk_id` is a bigint column in both, matching
      `t.references :fk` (schema.rb:1393).
- [ ] `fk_name` still creates cleanly on SQLite, PostgreSQL and MySQL/MariaDB —
      the MariaDB lane is the one that would catch a half-applied widening.
- [ ] Decide the `t.references` default index on `fk_id` and declare it (or
      record why not) in both sources.
