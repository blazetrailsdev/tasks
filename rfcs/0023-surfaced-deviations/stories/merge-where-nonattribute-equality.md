---
title: "merge-where-nonattribute-equality"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' where-clause merge "keeps last equality" for predicates whose LHS is any
node, not just a plain column. The trails where-clause merge only recognizes a
plain `Attribute` LHS when deciding which existing predicate a new equality
replaces, so an `Arel::Nodes::NamedFunction` LHS (e.g. `abs(salary)`) is not
matched and both predicates survive → no rows.

Surfaced by the faithful port of `relation/merging_test.rb`
(`test_relation_merging_with_arel_equalities_keeps_last_equality_with_non_attribute_left_hand`),
`it.skip` in packages/activerecord/src/relation/merging.test.ts with this slug.

Impl: packages/activerecord/src/relation/where-clause.ts (merge / extract
attributes). Rails ref:
vendor/rails/activerecord/lib/active_record/relation/where_clause.rb.

## Acceptance criteria

- [ ] where-clause merge replaces the prior equality when the new predicate's
      LHS is a NamedFunction (or any node), matching Rails.
- [ ] Un-skip the "...non attribute left hand" test; it passes (both merge and
      rewhere paths return `[poor_jamis]`).
