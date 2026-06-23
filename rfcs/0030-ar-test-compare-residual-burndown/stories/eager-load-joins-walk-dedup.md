---
title: "eager-load-joins-walk-dedup"
status: in-progress
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3990
claim: "2026-06-23T13:02:39Z"
assignee: "eager-load-joins-walk-dedup"
blocked-by: null
---

## Context

trails emits eager-load joins (`_executeEagerLoad` → `_buildEagerJoinManager`,
relation.ts:~4877) and manual `joins(...)` (`_applyJoinsToManager`,
relation.ts:~3311) in SEPARATE passes with SEPARATE alias trackers, unlike
Rails which builds ONE `JoinDependency` for joins_values + eager and walks it
once (`join_constraints` → `walk`, join_dependency.rb:97-220). Rails' `walk`
dedups a join shared by both (`r.table = l.table`) to a single un-aliased join.

PR #3974 (story cascaded-eager-join-emit-alias) approximated the shared
alias_tracker by seeding the eager JoinDependency's construction tracker with
the manual-join tables (relation.ts `_addEagerSpecsToJoinDependency`), so a
through intermediate landing on a manual join aliases (`posts` + `posts_authors`).
But an eager/promoted ROOT that coincides with a manual join of the SAME
association (`Author.joins(:posts).eager_load(posts: :comments)`) is then aliased
to `posts_authors` — a valid, correctly-scoped EXTRA OUTER JOIN — rather than
Rails' single `walk`-deduped un-aliased join. (Before #3974 this case emitted two
un-aliased `posts` → `ambiguous column name`.)

The `includes ∩ joins` intersection IS deduped (`_joinedIncludesValues` /
`_joinedIncludesTables` + the skip in `_buildEagerJoinManager`:4894), but only
for `includes`, not `eager_load` or references-promoted roots.

## Acceptance criteria

- [x] `Author.joins(:posts).eager_load(posts: :comments)` emits ONE un-aliased
      `posts` join (manual INNER), with `comments` joined onto it — matching
      Rails `walk` dedup; no `posts_authors`.
- [x] Same for `joins(:x).eager_load(:x)` (single-step) and dotted/promoted roots.
- [x] Extend the dedup mechanism (`_joinedIncludesTables` skip, or a real
      cross-pass `walk`) to eager_load/promoted roots that coincide with a manual
      join, not just `includes`.
- [x] Do not regress the cascaded-eager / eager / through alias suites.
