---
title: "Unify AliasTracker across inner/left-outer/eager join buckets (one JoinDependency alias namespace)"
status: claimed
updated: 2026-06-17
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 50
pr: null
claim: "2026-06-17T15:53:59Z"
assignee: "unify-alias-tracker-across-join-buckets"
blocked-by: null
---

## Context

trails builds a _separate_ `JoinDependency` (each with its own `AliasTracker`)
per join bucket in `buildJoinBuckets` (`relation/query-methods.ts:2484`): the
inner `joins`/`joins_values` bucket and the `leftOuterJoins`/eager bucket do not
share alias state. Rails, by contrast, builds one unified `JoinDependency` whose
single `AliasTracker` sees every joined table, so a self-join collision between
an inner join and a left-outer join on the SAME table is aliased consistently
(`{plural}_{owner_table}` + `_N`) and both the JOIN and any predicate reference
the same alias.

This gap is the blocker that prevents fully removing the flat-string ON-rebind
path from `whereAssociated`/`whereMissing` (see sibling story
`route-where-assoc-missing-through-join-dependency`). Concretely, the enum
self-join tests in `relation/where-chain.test.ts` —
`joins(:readingListing)` (inner, `wc_books`) combined with
`missing(:unreadListing)` (left-outer, also `wc_books`) — require the
left-outer `wc_books` join to be aliased _relative to_ the inner one. With
per-bucket AliasTrackers neither bucket sees the other's `wc_books`, so both
emit unaliased and the SQL collides. The current flat path only works around
this by unifying collision detection by hand via `_namedInnerJoinClauses`.

## Acceptance criteria

- Inner (`_namedInnerJoins`/`_joinValues`) and left-outer
  (`_leftOuterJoinsValues`) / eager join buckets share a single `AliasTracker`
  so a same-table join in one bucket is aliased relative to a sibling join in
  another bucket, matching Rails' unified `JoinDependency`.
- A predicate added by `whereAssociated`/`whereMissing` (or any
  `where(assoc => …)`) for a cross-bucket self-joined association references the
  same alias the JOIN emits.
- The enum self-join tests ("missing with enum*", "associated with enum*" in
  `relation/where-chain.test.ts`) pass with the flat-path collision workaround
  (`_namedInnerJoinClauses`) removed.
- No regression to existing `joins`/`leftOuterJoins`/`includes`/`eagerLoad`
  alias output (snapshot/parity fixtures unchanged unless verifiably matching a
  new Rails-faithful alias).
- Single PR from main. No stacked PRs.
