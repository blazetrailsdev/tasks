---
title: "converge-eager-count-aggregate-path-onto-build-joins-emitter"
status: done
updated: 2026-07-04
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4531
claim: "2026-07-04T01:35:36Z"
assignee: "converge-eager-count-aggregate-path-onto-build-joins-emitter"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #4523 (inner-join-association-surfaced-deviations). Two DONE
stories converged the eager-load **SELECT / record-loading** path onto the
single `build_joins` emitter with one genuinely-shared `AliasTracker`:

- `thread-shared-tracker-through-eager-select-paths` (PR #4297)
- `converge-eager-select-path-onto-build-joins-emitter` (PR #4326)

Both targeted `relation.ts` (`_buildEagerJoinManager` / `_buildEagerIdSubquery`).
The eager-load **count / aggregate** path in `calculations.ts`
(`performCount`, `singleAggregate`) is a SEPARATE bespoke reimplementation that
was never folded through `emitJoinPlan`. It builds the eager `JoinDependency`
inline at 5 sites and calls `jd.joinConstraints([], <tracker>, references)`
directly, then appends the manual joins via `_applyJoinsToManager` (a second,
independent tracker).

PR #4523 closed the last observable gap the same way #4297 did for the SELECT
path — by reconstructing a matched-seed tracker per emit site via a new helper
`eagerJoinAliasTracker(rel)` (calculations.ts), which delegates to
`buildMergedJoinAliasTracker` seeded with `_joinValues` — so a self-referential
`Person.eager_load(:agents).joins("... agents_people_2 ...")` count now aliases
the eager join `agents_people_2`. But this is emulation: the eager JD and the
manual joins still build TWO trackers with matched seeds, exactly the
divergence surface `converge-eager-select-path-onto-build-joins-emitter`
removed for SELECT (it eliminated `_buildEagerSharedJoinTracker` /
`seedConstructionTables` / skip filters). PR #4523 also dropped the
`explicitJoinTables` skip in `performCount`, so the only remaining divergence is
the parallel tracker construction, not spec skipping.

Rails routes count/aggregate through `apply_join_dependency`
(finder_methods.rb) which folds the eager JD into `joins_values` as a stashed
join, flowing through ONE `build_joins` call (query_methods.rb `build_joins`)
whose single `alias_tracker(leading_joins + join_nodes, aliases)` is shared
across the manual joins AND the eager JD; `walk` dedups coinciding associations.

trails/Rails refs:

- vendor/rails/activerecord/lib/active_record/relation/calculations.rb
  (`execute_simple_calculation`, `build_count_subquery`)
- vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb
  (`apply_join_dependency`)
- vendor/rails/activerecord/lib/active_record/relation/query_methods.rb
  (`build_joins`)
- packages/activerecord/src/relation/calculations.ts (`eagerJoinAliasTracker`,
  `performCount` eager branch, `singleAggregate` eager branch)
- packages/activerecord/src/relation/query-methods.ts (`emitJoinPlan`,
  `buildJoinBuckets`, `buildJoins`)

## Acceptance criteria

- [ ] The eager count/aggregate path (`performCount`, `singleAggregate`,
      `groupedAggregate`) folds its eager `JoinDependency` into the join buckets /
      stashed joins so it emits through the single `build_joins` port
      (`emitJoinPlan`) with ONE genuinely-shared `AliasTracker`, mirroring Rails
      `apply_join_dependency` + `build_joins`.
- [ ] The parallel `eagerJoinAliasTracker` helper and the inline
      `jd.joinConstraints(...)` emission sites in calculations.ts are removed or
      collapsed onto the shared emitter; coinciding manual/eager associations
      dedup via the JD `walk` fold rather than matched-seed trackers.
- [ ] Existing eager / count / aggregate / limited-ids / merge suites stay green,
      including the un-skipped `inner-join-association.test.ts` eager+join cases;
      `test:compare` and `api:compare` non-negative.
