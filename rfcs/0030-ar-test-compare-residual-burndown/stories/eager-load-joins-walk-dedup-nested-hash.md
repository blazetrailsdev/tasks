---
title: "eager-load-joins-walk-dedup-nested-hash"
status: blocked
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps:
  - eager-load-joins-walk-dedup
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-23T13:52:41Z"
assignee: "eager-load-joins-walk-dedup-nested-hash"
blocked-by: "Depends on open PR #3990 (story eager-load-joins-walk-dedup), still unmerged. That PR introduces the exact helpers this story extends (_specRootNames, _eagerRootNames, _joinedEagerValues, _dedupedManualJoinTables) and modifies the identical regions of relation.ts (_addEagerSpecsToJoinDependency, _buildEagerJoinManager, _buildEagerIdSubquery). A standalone PR from main would either stack on #3990 (forbidden) or duplicate/conflict with it (full file overlap). Re-claim once #3990 merges into main, then extend _joinedEagerValues/_specRootNames to walk hash/array manual-join specs at every nested level."
---

## Context

PR #3990 (story eager-load-joins-walk-dedup) deduped an eager-load ROOT that
coincides with a STRING-form manual `joins(...)` of the same association
(`Author.joins(:posts).eager_load(posts: :comments)`), mirroring Rails'
`JoinDependency#walk` (`join_dependency.rb:214`, `match?` → reflection equality).

The dedup is intentionally limited to STRING-rooted manual joins:
`_joinedEagerValues` (relation.ts:~2749) builds its `joined` set only from
_string_ entries of `_namedInnerJoins`, and `_specRootNames` only resolves spec
roots — not nested levels. So a HASH-form manual join is NOT deduped:

`Author.joins(posts: :comments).eager_load(posts: :comments)`

still emits a duplicate un-aliased `posts` join and raises
`ambiguous column name: posts.id`. Rails' `walk` recurses and dedups at EVERY
level (`join_dependency.rb:219`), not just roots — so the nested `comments`
shared by both the manual hash-join and the eager spec should also collapse.

## Acceptance criteria

- [ ] `Author.joins(posts: :comments).eager_load(posts: :comments)` emits ONE
      un-aliased `posts` and ONE `comments` join (manual INNER wins), matching
      Rails `walk`'s recursive dedup — no duplicate, no ambiguous column.
- [ ] Dedup recurses to nested levels of a hash-form manual join, not just the
      root (extend `_joinedEagerValues`/`_specRootNames` to walk hash/array
      manual-join specs, or implement a real cross-pass `walk`).
- [ ] Do not regress the string-rooted dedup from PR #3990 or the
      cascaded-eager / eager / through alias suites.
