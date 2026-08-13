---
title: "build_with_expression_from_value drops Rails' nested arg; buildWithValueFromHash adds an invented CTE-name guard"
status: draft
updated: 2026-08-13
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `build_with_value_from_hash` (#6463).

Two divergences in the neighbouring ported bodies
(`packages/activerecord/src/relation/query-methods.ts:2359-2394`):

1. `build_with_expression_from_value`
   (`activerecord/lib/active_record/relation/query_methods.rb:1929-1950`) takes
   a second parameter, `nested = false`, and branches on it: an
   `ActiveRecord::Relation` value yields `value.arel.ast` when nested and
   `value.arel` otherwise; the array arm recurses with `nested = true`. trails'
   `buildWithExpressionFromValue` takes one parameter and always returns the
   AST, so the non-nested arm's `SelectManager` return is lost.

2. `buildWithValueFromHash` throws an invented `ArgumentError`
   (`Invalid CTE name "…": must be a valid SQL identifier …`) for a name that
   does not match `/^[A-Za-z_][A-Za-z0-9_]*$/`. Rails has no such guard — it
   passes the name straight to `TableAlias.new` and lets the visitor quote it.

## Converged shape

- Port the `nested` parameter with Rails' default and both arms, and recurse
  with `nested = true` from the array arm.
- Delete the identifier validation and its error, or — if a real caller depends
  on it — move the check to that caller with the Rails `file:line` that forces
  it.

## Acceptance criteria

- [ ] `buildWithExpressionFromValue` has Rails' arity, parameter name and
      default, and both `Relation` arms.
- [ ] No invented `ArgumentError` remains in `buildWithValueFromHash`.
- [ ] `relation/with.test.ts` green on all three adapters.
