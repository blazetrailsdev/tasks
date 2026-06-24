---
title: "Mirror Rails' second using_limitable_reflections? clause (joins ∪ left_outer_joins) across all three distinct-PK deferral sites"
status: in-progress
updated: 2026-06-24
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["relation-handler-distinct-pk-load-time-materialization"]
deps-rfc: []
est-loc: 120
priority: 2
pr: 4073
claim: "2026-06-24T17:50:40Z"
assignee: "using-limitable-reflections-joins-leftjoins-convergence"
blocked-by: null
---

## Context

`RelationHandler` defers distinct-PK materialization for an eager-loading
`where(x: <relation>)` subquery with a limit/offset over a collection reflection
(PR #3919, story `relation-handler-distinct-pk-load-time-materialization`). The
decision to defer is made by `_isDeferredDistinctPkSubquery`
(`packages/activerecord/src/relation.ts`), which mirrors Rails
`apply_join_dependency` (`finder_methods.rb:457-470`).

Rails materializes unless **both** of these are limitable:

1. the eager join-dependency reflections (`eager_load_values | includes_values`), and
2. a second join-dependency built from
   `select_association_list(joins_values) ∪ select_association_list(left_outer_joins_values)`
   (`finder_methods.rb:464-470`).

trails currently checks only clause (1), via `_eagerReflectionsAreLimitable`.
The same eager-only approximation already lives in two sibling sites:

- `Relation#applyJoinDependencyForArel` (`relation.ts`, the throw/guard path), and
- `Relation#_pluckInner` (`relation.ts`, the pluck apply-join-dependency branch).

So an inner relation with limitable eager reflections but a **collection** in
`joins`/`leftOuterJoins` skips deferral and emits the inline `IN (SELECT …
LIMIT n)` that MySQL rejects.

## Scope

Converge all three sites to Rails' two-clause `using_limitable_reflections?`
check together (build the second join-dependency from
`joins_values ∪ left_outer_joins_values` and require both to be limitable),
rather than diverging one site from the other two.

## Acceptance criteria

- [ ] `_isDeferredDistinctPkSubquery`, `applyJoinDependencyForArel`, and
      `_pluckInner` all evaluate limitability over BOTH the eager reflections AND
      the `joins ∪ left_outer_joins` reflections (finder_methods.rb:464-470).
- [ ] A subquery with limitable eager reflections but a collection in
      `joins`/`leftOuterJoins` defers (materializes) and emits `pk IN (ids)` on
      all three adapters — no LIMIT-in-IN.
- [ ] `test:compare` / `api:compare` delta ≥ 0.

## Rails source

- `vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457-470`
  (`apply_join_dependency`, the two-clause `using_limitable_reflections?`).
