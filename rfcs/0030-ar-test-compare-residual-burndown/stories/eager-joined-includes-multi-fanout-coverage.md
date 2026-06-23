---
title: "eager_test: regression coverage for multi-include joins∩includes fan-out"
status: done
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3988
claim: "2026-06-23T12:57:40Z"
assignee: "eager-joined-includes-multi-fanout-coverage"
blocked-by: null
---

## Context

PR #3928 (a1-eager-joined-table-conditions-order) implemented Rails'
`joined_includes_values` promotion: once an include is also present in
`joins(...)`, ALL includes are promoted to eager_load (mirroring
`apply_join_dependency` building the JD from `eager_load_values | includes_values`).
`_buildEagerJoinManager` / `_buildEagerIdSubquery` then skip re-emitting the eager
OUTER JOIN only for the `includes ∩ joins` intersection tables; non-intersecting
includes stay as OUTER eager joins (relation.ts `_includesToPromoteFromJoins`,
`_joinedIncludesTables`).

The single-include intersection path is covered by `joins with includes should
preload via joins` and the select.test.ts `.first()` cases. The multi-include
fan-out branch — e.g. `Post.includes(:comments, :author).joins(:comments)`, where
`comments` collapses to the existing INNER JOIN and `author` is join-loaded as a
deduped OUTER join, all in one query — is implemented but has no direct regression
test (no in-scope Rails counterpart exercised it). Flagged in PR #3928 review.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb;
relation.rb `eager_loading?`; finder_methods.rb:457 `apply_join_dependency`.

## Acceptance criteria

- [x] A regression test (canonical Post/Author/Comment models + fixtures) asserting
      `Post.includes("comments","author").joins("comments")` eager-loads BOTH
      associations in a single query (`assertQueriesCount(1)`), with `comments`
      satisfied by the INNER join and `author` by an OUTER join, and both readable
      under `assertNoQueries`.
- [x] No new gate-mismatches.
