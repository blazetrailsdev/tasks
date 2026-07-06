---
title: "finder-methods applyJoinDependency reads neither joins_values nor left_outer_joins_values"
status: claimed
updated: 2026-07-06
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 9
pr: null
claim: "2026-07-06T14:05:00Z"
assignee: "converge-finder-apply-join-dependency-read-join-values"
blocked-by: null
closed-reason: null
---

## Context

Rails `FinderMethods#apply_join_dependency`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457`)
reads `joins_values` and `left_outer_joins_values` when constructing the join
dependency for eager loading. The trails port
(`packages/activerecord/src/relation/finder-methods.ts:761`
`applyJoinDependency(rel, eagerLoading)`) is a divergent implementation: it uses
the preloader path and mutates `_joinClauses` types, reading neither join
accessor. Surfaced by PR #4656 as a residual wide-call mismatch
(`apply_join_dependency -> joins_values` / `left_outer_joins_values`).

This is a genuine behavioral divergence, not a tooling artifact — converging
requires the trails apply_join_dependency to build the join dependency from the
join values the way Rails does.

## Acceptance criteria

- Converge `applyJoinDependency` toward Rails: derive the join dependency from
  `joinsValues` / `leftOuterJoinsValues` rather than the ad-hoc `_joinClauses`
  rewrite (or document why the preloader path is a faithful equivalent and the
  wide-call entry is bucket-(b), not a divergence).
- Preserve existing eager-loading test behavior.
- Remove or reclassify the residual `apply_join_dependency` wide-call entries.
