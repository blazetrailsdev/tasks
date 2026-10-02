---
title: "activerecord: aggregate_column, construct_relation_for_exists and append_constraints test arel_node? where Rails does not"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`arel-attribute-and-sql-literal-are-not-nodes` took `Arel::Attributes::Attribute`
and `Arel::Nodes::SqlLiteral` off `Arel::Nodes::Node`, so each
`instanceof Nodes.Node` in activerecord that used to admit them was rewritten to
`arelNode(...)` to keep its behaviour. Three of those sites have no
`arel_node?` in Rails at all, and were left as they were found:

- `aggregateColumn` (`packages/activerecord/src/relation/calculations.ts`)
  returns the column when `arelNode(columnName)`. Rails'
  `aggregate_column` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:414-423`)
  is `case column_name when Arel::Expressions`, a module test: it admits
  `Attribute`, `SqlLiteral` and every `NodeExpression`, and not a bare `Node`.
- `constructRelationForExists` (`packages/activerecord/src/relation/finder-methods.ts`)
  has an `arelNode(conditions)` arm calling `relation.where(conditions)`. Rails'
  `construct_relation_for_exists`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb`)
  has two arms only: `when Array, Hash` and the `primary_key => conditions` else.
- `appendConstraints` (`packages/activerecord/src/associations/join-dependency/join-association.ts`)
  filters `constraints` through `arelNode` and guards `right.expr` with it.
  Rails' `append_constraints`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency/join_association.rb`)
  does neither: it is `constraints.unshift(join.left)` / `constraints.unshift(right.expr)`
  into an `And`, mutating the join in place.

## Acceptance criteria

- [ ] `aggregateColumn` tests `Arel::Expressions` membership (the module, through ruby-compat's include registry), not `arelNode`.
- [ ] `constructRelationForExists` has Rails' two arms, or the extra arm is shown to be reachable from a Rails test and receipted.
- [ ] `appendConstraints` has Rails' body: no filter, no `expr` guard, the join mutated in place.
- [ ] `pnpm parity:api:calls` stays green; `relation/` and `associations/join-dependency` tests green.
