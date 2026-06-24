---
title: "Converge emitJoinPlan to Rails' single construct_join_dependency(named_joins, join_type) shape"
status: done
updated: 2026-06-24
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4079
claim: "2026-06-24T19:14:40Z"
assignee: "build-joins-emit-single-construct-join-dependency"
blocked-by: null
---

## Context

The unified `build_joins` emitter `emitJoinPlan`
(`packages/activerecord/src/relation/query-methods.ts`, after PR #4072) keeps
trails' historical **three-branch** emission instead of Rails' single
`construct_join_dependency(named_joins, join_type)` call.

Rails `build_joins` (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1881`):

```ruby
unless named_joins.empty? && stashed_joins.empty?
  alias_tracker = alias_tracker(leading_joins + join_nodes, aliases)
  join_dependency = construct_join_dependency(named_joins, join_type)
  join_sources.concat(join_dependency.join_constraints(stashed_joins, alias_tracker, references_values))
end
```

i.e. ONE `construct_join_dependency(named_joins, join_type)` where `join_type`
is `InnerJoin` normally or `OuterJoin` in the pure-left-outer short-circuit,
folding `stashed_joins` into a single `join_constraints` call — even when
`named_joins` is empty but `stashed_joins` is non-empty (it builds
`construct_join_dependency([], InnerJoin)`).

trails' `emitJoinPlan` instead has three branches:

- `this._namedInnerJoins.length > 0` → `constructJoinDependency(namedInner, InnerJoin)`
- `else if plan.namedJoins.length > 0` → `constructJoinDependency(namedJoins, OuterJoin)`
- `else if plan.stashedJoins.length > 0` → `[primary, ...rest] = stashedJoins; primary.joinConstraints(rest, ...)`

The third branch (eager-only / explicit-join-with-stash, no named association
joins) pops the first stashed JoinDependency as the primary rather than
constructing an empty JD as Rails does. Behavior is currently equivalent on
covered cases but the structure diverges and could drift.

## Acceptance criteria

- [ ] `emitJoinPlan` mirrors Rails' single guarded `construct_join_dependency(named_joins, join_type)` shape (collapse the three branches), with the empty-named-JD case using `constructJoinDependency([], InnerJoin)`.
- [ ] Existing join suites (inner/left-outer join association, where, where-chain, merging, has-many-through, arel-ast-convergence, build-joins-from-subquery-dedup) stay green.
- [ ] api:compare and test:compare deltas non-negative.
