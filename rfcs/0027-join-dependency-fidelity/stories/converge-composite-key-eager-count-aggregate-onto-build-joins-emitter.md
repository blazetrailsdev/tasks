---
title: "Fold composite-key eager count/aggregate paths onto the shared build_joins emitter"
status: in-progress
updated: 2026-07-04
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4549
claim: "2026-07-04T14:19:28Z"
assignee: "converge-composite-key-eager-count-aggregate-onto-build-joins-emitter"
blocked-by: null
closed-reason: null
---

## Context

Follow-up surfaced while converging the eager count/aggregate path onto the
shared `build_joins` emitter (PR #4531,
`converge-eager-count-aggregate-path-onto-build-joins-emitter`). Two
composite-key code paths in `packages/activerecord/src/relation/calculations.ts`
were left OUT of the eager-JD fold and still diverge from Rails
`apply_join_dependency`:

1. **Composite-PK single-value eager count** — `performCount`'s eager branch
   guards the whole DISTINCT-on-pk fan-out-prevention block with
   `if (!Array.isArray(pk))` (calculations.ts ~700). A composite-PK model doing
   `Cpk.eager_load(:assoc).count` therefore skips the eager fold + DISTINCT and
   falls through to the plain non-eager count, so a has-many eager association
   fans out / is not joined the way Rails' `calculate` (calculations.rb:217-238)
   does. The inline comment already flags this: "CPK + grouped eagerLoad not yet
   supported; fall through".

2. **Composite-FK belongs_to group-by eager aggregate** — `groupedCompositeAssoc`
   (calculations.ts ~575) emits `rel._applyJoinsToManager(manager)` WITHOUT the
   `eagerJd` argument, so `Model.eager_load(:x).group(:composite_fk_belongs_to)
.count/.sum` does not fold the eager JoinDependency through the shared
   `emitJoinPlan` port (unlike `singleAggregate`/`groupedAggregate`, which PR
   #4531 converged via `collectEagerSpecs` + `_applyJoinsToManager(manager,
eagerJd)`).

Rails routes all of these through the single `apply_join_dependency` +
`build_joins` path regardless of key arity; trails should extend the
`collectEagerSpecs` + shared-emitter fold to both composite-key paths.

trails/Rails refs:

- packages/activerecord/src/relation/calculations.ts (`performCount` CPK guard,
  `groupedCompositeAssoc`, `collectEagerSpecs`)
- vendor/rails/activerecord/lib/active_record/relation/calculations.rb
  (`calculate` :217-238, `execute_grouped_calculation`)
- vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb
  (`apply_join_dependency`)

## Acceptance criteria

- [ ] Composite-PK `eager_load(:assoc).count` folds the eager JD through the
      shared `build_joins` emitter with the DISTINCT-on-pk fan-out guard (Rails
      `calculate`), instead of the `!Array.isArray(pk)` fall-through.
- [ ] `groupedCompositeAssoc` folds its eager JD via
      `_applyJoinsToManager(manager, eagerJd)` (build it via `collectEagerSpecs`),
      mirroring `singleAggregate`/`groupedAggregate`.
- [ ] Add/port the corresponding Rails composite-key eager count/aggregate test
      cases; `test:compare` / `api:compare` non-negative.
