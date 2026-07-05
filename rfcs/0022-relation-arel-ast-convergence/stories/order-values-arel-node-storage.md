---
title: "Store order clauses as Arel nodes so order_values returns the stored reference"
status: claimed
updated: 2026-07-05
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 2
pr: null
claim: "2026-07-05T18:21:54Z"
assignee: "order-values-arel-node-storage"
blocked-by: null
---

## Context

`relation-value-accessor-rails-semantics` (PR #4293) converged the
`select_values` and `group_values` readers to stored-reference semantics
(matching Rails' `@values.fetch(:name, FROZEN_EMPTY_ARRAY)`), but `order_values`
could not converge: trails stores raw SQL orderings as `{ raw }` marker objects
in `_orderClauses` and the reader normalizes them to `Arel::Nodes::SqlLiteral`
on read (relation.ts `get orderValues`), so it necessarily allocates a fresh
array instead of returning the stored reference. This is a documented,
accessor-local exception to the stored-reference rule the other MULTI_VALUE
readers follow.

Rails stores `Arel::Nodes::SqlLiteral` / ordering nodes directly in
`@values[:order]` and `order_values` returns the stored array by reference
(`relation/query_methods.rb:162-181`, `MULTI_VALUE_METHODS` default
`FROZEN_EMPTY_ARRAY`).

## Acceptance criteria

- Store order clauses as Arel ordering / `SqlLiteral` nodes directly (eliminate
  the `{ raw }` marker shape and the on-read normalization), so `order_values`
  returns the stored reference like `select_values` / `group_values`.
- Update the `order_values` JSDoc to drop the documented-exception note once it
  no longer applies.
- relation.rb / relation/query_methods.rb stay at 100% api:compare; no
  test:compare regression.
