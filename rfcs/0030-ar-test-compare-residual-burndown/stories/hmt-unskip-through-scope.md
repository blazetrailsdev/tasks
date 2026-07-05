---
title: "hmt-unskip-through-scope"
status: in-progress
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: 4518
claim: "2026-07-03T21:43:07Z"
assignee: "hmt-unskip-through-scope"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-through-associations.test.ts` was converged in PR #4224. Six tests exercising scoped HMT queries remain skipped due to gaps in through-scope handling in `AssociationRelation` and `CollectionProxy`:

- trails: `associations/has-many-through-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`

Skipped tests:

- `through association with through scope and nested where` (line 266) — HMT scoped through a lambda with chained `.where` on the through model; nested where conditions applied to the join
- `has many through with through scope with includes` (line 1559) — `includes` on a scoped HMT preloads correctly respecting the through scope
- `has many through with through scope with joins` (line 1567) — `joins` on a scoped HMT generates correct SQL with through conditions
- `has many through unscope default scope` (line 1997) — `unscope(:where)` on a HMT removes the through scope correctly
- `has many through with scope that has joined same table with parent relation` (line 2064) — HMT scope joins the same table as the parent relation without double-alias conflicts
- `has many through with scope should accept string and hash join` (line 2084) — HMT scope accepts both string and hash join forms

Rails source: `activerecord/lib/active_record/associations/has_many_through_association.rb`, `association_scope.rb`, `join_dependency.rb`.

## Acceptance criteria

- [ ] Un-skip and pass all six tests under SQLite, PG, and MariaDB
- [ ] Nested `.where` conditions on a scoped HMT are propagated to the generated JOIN SQL
- [ ] `includes`/`joins` respect the through-association scope conditions
- [ ] `unscope(:where)` removes HMT default scope conditions
- [ ] Self-join cases don't produce duplicate table aliases
- [ ] No production regressions in `has-many-through-associations.test.ts`
