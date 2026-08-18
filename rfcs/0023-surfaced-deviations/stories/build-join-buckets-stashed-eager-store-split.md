---
title: "Decide: re-merge trails' three joins stores, or pin build_join_buckets' missing base_klass guard"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: query-methods.ts:3390-3400 now keeps ONE joinsValues store and ports the discriminator literally (joins.last instanceof JoinDependency && lastJoinValue.baseKlass === this.model -> pop), with the cross-klass JD explicitly left in the stream for selectNamedJoins as Rails does (query_methods.rb:1847-1850). _eagerLoadAssociations, _namedInnerJoinDeps and _leftOuterJoinDeps are gone repo-wide."
---

## Context

Surfaced while converging cross-helper `model` reads (PR #5371, story
`converge-relation-cross-helper-model-reads`).

Rails keeps ONE `joins_values` store that holds association names, raw string
joins, Arel join nodes AND stashed `JoinDependency` objects. `build_join_buckets`
(vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1847-1850)
therefore has to discriminate at runtime:

```ruby
joins = joins_values.dup
if joins.last.is_a?(ActiveRecord::Associations::JoinDependency)
  stashed_eager_load = joins.pop if joins.last.base_klass == model
end
```

trails splits that one store into three: `joinsValues` (names + raw nodes),
`_eagerLoadAssociations` (the eager stash) and `_namedInnerJoinDeps` /
`_leftOuterJoinDeps` (cross-klass JDs merged in from a `.merge` against a
different-model relation). `buildJoinBuckets`
(packages/activerecord/src/relation/query-methods.ts, the `_eagerLoadAssociations`
block) pops the eager stash unconditionally, because in that store it is always
this relation's own model — so the `base_klass == model` discriminator has no
`joins.last` to test and cannot be ported literally. The wide-ratchet `model`
entry for `build_join_buckets` is excluded with exactly this reason.

The split is not obviously wrong, but it is a structural divergence that hides
one Rails behaviour: a JoinDependency for a DIFFERENT klass sitting at the tail
of `joins_values` is left in place by Rails and emitted as a normal join, while
trails routes it through a separate store entirely. Worth deciding
deliberately rather than by accident.

## Acceptance criteria

- Decide: either re-merge the three stores into one `joinsValues` holding
  JoinDependencies (making the Rails guard portable verbatim), or document the
  split as a permanent, reasoned deviation with a test that pins the
  cross-klass-merge behaviour both implementations must agree on.
- If re-merged, `buildJoinBuckets` carries `joins.last.base_klass == model`
  literally and the wide-ratchet exclusion for it is deleted.
- Rails tests covering `.merge` against a different-model relation combined with
  `eager_load` / `left_outer_joins` stay green; no new bespoke tables.
