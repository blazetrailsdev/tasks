---
title: "Relation#order leaves string order fragments bare (no qualify/quote), matching Rails"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the faithful port of the `finder_test.rb` `include?`/`member?`
cluster (PR #4425, story faithful-port-finder-conditions-cluster).

Rails' `test_include_on_unloaded_relation_with_offset` /
`test_member_on_unloaded_relation_with_offset` assert
`assert_queries_match(/ORDER BY name ASC/)` for
`Customer.offset(1).order("name ASC")`. Rails passes a **string** order
argument through as a raw `Arel::Nodes::SqlLiteral` — it stays bare:
`ORDER BY name ASC`.

trails instead parses the raw string order fragment and **qualifies + quotes**
the column name, emitting
`ORDER BY "customers"."name" ASC` (observed generated SQL:
`SELECT "customers".* FROM "customers" ORDER BY "customers"."name" ASC LIMIT -1 OFFSET 1`).

This is a genuine SQL-generation deviation: Rails only qualifies/quotes
**symbol** order args (`order(:name)` → `customers.name`); string order args
are left verbatim. trails treats string fragments the same as symbols. To keep
the ported tests green, the offset assertions in finder.test.ts were built with
`quoteTableName`/`escapeRegExp` (matching the file's existing convention) rather
than Rails' bare `/ORDER BY name ASC/` — a deviation noted in the PR body.

Related but distinct: `merge-cross-model-order-qualification` (0023, done, in
PR 4161) covers cross-model `merge` order qualification;
`resolve-order-matcher-without-connection-getter` (0023, done, in PR 3894)
covers the connection-leak in `resolveOrderMatcher`. Neither addresses
string-vs-symbol order-arg quoting.

Rails ref: `PredicateBuilder` / `Arel` order handling — string order args become
`Arel::Nodes::SqlLiteral` (unquoted), symbols route through column resolution.
See `Relation#preprocess_order_args` and `arel_columns`
(vendor/rails/activerecord/lib/active_record/relation/query_methods.rb).

## Acceptance criteria

- [ ] `Relation#order` leaves **string** order fragments bare (no table
      qualification, no column quoting), matching Rails.
- [ ] `Customer.offset(1).order("name ASC")` emits `ORDER BY name ASC`.
- [ ] Symbol order args (`order(:name)`) still qualify/quote as before.
- [ ] Update the two offset assertions in finder.test.ts back to Rails' bare
      `/ORDER BY name ASC/` once the impl converges.
- [ ] No regression in existing order tests.
