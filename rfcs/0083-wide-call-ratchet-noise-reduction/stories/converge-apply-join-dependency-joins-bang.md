---
title: "converge-apply-join-dependency-joins-bang"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps:
  - converge-merged-join-deps-into-joins-values
deps-rfc: []
est-loc: null
priority: null
pr: 5747
claim: "2026-07-31T19:53:11Z"
assignee: "converge-apply-join-dependency-joins-bang"
blocked-by: null
closed-reason: null
---

## Context

Step 2 of 3 in the ordered split of `converge-build-join-buckets-single-joins-store`
(RFC 0083). Depends on step 1, `converge-merged-join-deps-into-joins-values`.

Rails `apply_join_dependency`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457-461`)
builds the eager JoinDependency and pushes it into `joins_values`:

```ruby
join_dependency = construct_join_dependency(
  eager_load_values | includes_values, Arel::Nodes::OuterJoin
)
relation = except(:includes, :eager_load, :preload).joins!(join_dependency)
```

That `joins!` is the _only_ reason `build_join_buckets` needs the
`joins.last.base_klass == model` discriminator at `query_methods.rb:1847-1850`:
the eager JD is the one built on this relation's own model, as opposed to a
cross-klass merged JD from `merge_joins`.

trails' `applyJoinDependency` (`packages/activerecord/src/relation.ts:4856-4892`)
diverges: it clears the eager stores and returns `rel.leftOuterJoins(eagerSpecs)`,
so no JoinDependency ever lands in `joinsValues`. `buildJoinBuckets`
(`packages/activerecord/src/relation/query-methods.ts:2901-2916`) compensates by
constructing the eager JD inline from `_eagerLoadAssociations` at bucket-build
time, and the live SQL path pre-emits eager JOINs through the trails-invented
`_buildEagerJoinManager` (`relation.ts:5204`) outside the bucket routing
altogether.

Note the audit's correction to the parent story's framing: `_eagerLoadAssociations`
is trails' faithful port of Rails' `eager_load_values` and must NOT be merged into
`joinsValues`. What is missing is the `joins!(join_dependency)` step, not the store.

## Scope

Converge `applyJoinDependency` to Rails' shape — `except(:includes, :eager_load,
:preload).joins!(constructJoinDependency(eagerLoad | includes, OuterJoin))` —
and retire the two compensating mechanisms it makes redundant: the inline eager-JD
construction in `buildJoinBuckets` and `_buildEagerJoinManager`'s eager
pre-emission.

The `distinct_relation_for_primary_key` materialization guard already ported at
`relation.ts:4876-4886` (and its `NotImplementedError` deviation) is out of scope —
leave it as-is.

## Acceptance criteria

- `applyJoinDependency` pushes a `JoinDependency` into `joinsValues` via `joins!`,
  matching finder_methods.rb:457-461, instead of routing through `leftOuterJoins`.
- `buildJoinBuckets` no longer constructs an eager JD from `_eagerLoadAssociations`;
  the eager stash arrives in `joinsValues` like Rails.
- The `joins_values.empty?` short-circuit at `query-methods.ts:2868-2889` drops its
  trails-specific `_eagerLoadAssociations.length === 0` clause, whose long
  explanatory comment documents exactly this divergence.
- Ported `eagerLoad` / `includes` / `joins` relation tests pass unchanged (no test
  renames). Eager SELECT aliasing and the limit/offset deferral paths are the main
  regression risks.
- If this exceeds 500 LOC, split again rather than shipping a partial merge.
