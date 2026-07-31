---
title: "Route calculations' eager paths through applyJoinDependency instead of inline JD construction"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 5756
claim: "2026-07-31T20:55:31Z"
assignee: "route-calculations-eager-paths-through-apply-join-dependency"
blocked-by: null
closed-reason: null
---

## Context

PR #5748 routed the eager JoinDependency through `joins_values` via a new
`Relation#_withEagerJoinDependency(jd)` helper, mirroring Rails'
`joins!(construct_join_dependency(...))`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457-461`).

The helper is still trails-only. In Rails there is exactly ONE place that
builds the eager JoinDependency and pushes it into `joins_values`:
`apply_join_dependency`. Calculations route through it
(`calculations.rb:217-238` — `relation = apply_join_dependency` before
dispatching to the grouped/simple calculation), rather than constructing a JD
locally. trails' `relation/calculations.ts` instead constructs the eager JD
inline at ~11 sites (`collectEagerSpecs` + `constructJoinDependency`, then
`_withEagerJoinDependency(...)`), duplicating what `Relation#applyJoinDependency`
already does — including the `except(:includes, :eager_load, :preload)` clear
and the `using_limitable_reflections?` / `distinct_relation_for_primary_key`
branch.

Note this depends on `converge-apply-join-dependency-joins-bang` (PR #5747),
which rewrites `applyJoinDependency` to return the `joins!`-carrying relation;
until that lands, calculations cannot delegate to it.

## Acceptance criteria

- The eager calculation paths in `relation/calculations.ts` obtain their
  relation from `applyJoinDependency` (Rails `calculate` /
  `execute_grouped_calculation`) instead of building a JoinDependency inline.
- `_withEagerJoinDependency` is retired once its last caller is gone, or the
  remaining callers are justified against a Rails call site.
- `calculations.test.ts`,
  `relation/cpk-eager-count-aggregate-build-joins-fold.trails.test.ts` and
  `associations/eager.test.ts` pass unchanged (no test renames).
