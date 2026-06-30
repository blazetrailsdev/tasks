---
title: "Converge the eager SELECT path onto the single build_joins emitter (one shared AliasTracker via stashed-join fold)"
status: in-progress
updated: 2026-06-30
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 4326
claim: "2026-06-30T15:32:37Z"
assignee: "converge-eager-select-path-onto-build-joins-emitter"
blocked-by: null
---

## Context

Rails `apply_join_dependency` (finder_methods.rb) folds the eager-load
`JoinDependency` into `joins_values` as a stashed join, so it flows through ONE
`build_joins` call (query_methods.rb:`build_joins`) whose single
`alias_tracker(leading_joins + join_nodes, aliases)` is genuinely shared across
the manual joins AND the eager JD — `walk` dedups coinciding associations and
collisions alias against one tracker.

trails instead keeps a SEPARATE eager SELECT-preview path
(`_buildEagerJoinManager` / `_buildEagerIdSubquery`, relation.ts) that does NOT
go through `emitJoinPlan` (the shared `build_joins` port). PR #4297 closed the
last observable gap by reconstructing an equivalent tracker
(`_buildEagerSharedJoinTracker`) seeded the same way Rails' `alias_tracker` is
(base table + `_joinValues` raw nodes + `_joinClauses` + named-inner-join tables
minus `_dedupedManualJoinTables`, mirroring `seedConstructionTables`), but this
is emulation: the eager JD and the manual joins still build TWO trackers with
matched seeds and rely on `_dedupedManualJoinTables` table-name skipping instead
of Rails' `walk` fold. The duplicate seeding logic (`seedConstructionTables`,
`_buildEagerSharedJoinTracker`, the skip filters in both eager methods) is the
divergence surface.

trails/Rails refs:

- vendor/rails/.../relation/finder_methods.rb `apply_join_dependency`
- vendor/rails/.../relation/query_methods.rb `build_joins`
- packages/activerecord/src/relation.ts `_buildEagerJoinManager`,
  `_buildEagerIdSubquery`, `_buildEagerSharedJoinTracker`,
  `_addEagerSpecsToJoinDependency` (`seedConstructionTables`)
- packages/activerecord/src/relation/query-methods.ts `emitJoinPlan`,
  `buildJoins`

## Acceptance criteria

- [ ] The eager-load SELECT path folds its `JoinDependency` into the join
      buckets / stashed joins so it emits through the single `build_joins`
      port (`emitJoinPlan`) with ONE genuinely-shared `AliasTracker`, matching
      Rails `apply_join_dependency` + `build_joins`.
- [ ] Coinciding manual/eager associations dedup via the JD `walk` fold, not the
      `_dedupedManualJoinTables` table-name skip; the parallel seeding helpers
      (`_buildEagerSharedJoinTracker`, the eager `seedConstructionTables` seed,
      and the skip filters in both eager methods) are removed or collapsed.
- [ ] Existing eager / cascaded-eager / limited-ids / merge / through-aliasing
      suites stay green; `test:compare` and `api:compare` non-negative.
