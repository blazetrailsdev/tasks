---
title: "converge-merged-join-deps-into-joins-values"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5737
claim: "2026-07-31T18:38:55Z"
assignee: "converge-merged-join-deps-into-joins-values"
blocked-by: null
closed-reason: null
---

## Context

Step 1 of 3 in the ordered split of `converge-build-join-buckets-single-joins-store`
(RFC 0083), whose audit concluded the single-`joinsValues` re-merge cannot ship as
one PR under the 500 LOC ceiling.

Two sibling Rails methods in
`vendor/rails/activerecord/lib/active_record/relation/merger.rb` build a
cross-klass `JoinDependency` on the _other_ relation's model and push it straight
into the receiver's stores:

- `merge_joins` (merger.rb:117-134) — `relation.joins!(join_dependency, *others)`
  at :132, into `joins_values`.
- `merge_outer_joins` (merger.rb:136-153) —
  `relation.left_outer_joins!(join_dependency, *others)` at :151, into
  `left_outer_joins_values`.

`build_join_buckets` then routes those JDs through `select_named_joins` →
`select_association_list` (`query_methods.rb:1810-1822`), which stashes any
`JoinDependency` into `buckets[:stashed_join]`, so they are folded into the
primary JD's `join_constraints` like any other stash.

trails instead parks them in two side stores, `_namedInnerJoinDeps` and
`_leftOuterJoinDeps` (`packages/activerecord/src/relation.ts:455` and its
`_leftOuterJoinDeps` sibling), filled by
`packages/activerecord/src/relation/merge-joins.ts:85,94` and
`packages/activerecord/src/associations/association-scope.ts:1043,1065`.
`emitJoinPlan` (`packages/activerecord/src/relation/query-methods.ts:3084-3092`)
then appends their `joinConstraints([], sharedTracker())` output _directly_ to the
manager, bypassing the bucket routing entirely.

The machinery to receive them already exists: trails'
`selectAssociationList` (`query-methods.ts:2781-2795`) already stashes
`instanceof JoinDependency` values exactly as Rails does. Only the _store_ diverges.

## Scope

Move cross-klass merged JDs out of `_namedInnerJoinDeps` / `_leftOuterJoinDeps` and
into `joinsValues` / `leftOuterJoinsValues`, letting `selectNamedJoins` stash them,
and delete the `emitJoinPlan` direct-append special case.

Non-test call sites to update (from the audit inventory): `relation.ts:455,3293,3366,6963`
and the `_leftOuterJoinDeps` siblings; `relation/merge-joins.ts:22,85,94`;
`associations/association-scope.ts:1013,1027,1043,1064-1065`;
`relation/query-methods.ts:213,2699,2881,3084-3092,3134`.
Tests asserting on the store: `relation/merging.test.ts:293,298`.

Do NOT touch the eager stash in this story — that is step 2
(`converge-apply-join-dependency-joins-bang`). This story must leave
`buildJoinBuckets`' eager handling exactly as-is.

## Acceptance criteria

- `_namedInnerJoinDeps` and `_leftOuterJoinDeps` are gone; merged JDs live in
  `joinsValues` / `leftOuterJoinsValues`.
- `buildJoinBuckets` reaches them via `selectNamedJoins`' stash, and
  `emitJoinPlan` no longer appends them directly.
- Alias-tracker sharing is preserved: a merged join onto an already-joined table
  still aliases at emit time (`authors_categorizations`) — this is the behaviour
  the current direct-append path exists to guarantee, so it is the main
  regression risk.
- Ported `merge` / `joins` relation tests pass unchanged (no test renames).
- `relation/merging.test.ts:293,298` are rewritten against the new store, not
  deleted.
