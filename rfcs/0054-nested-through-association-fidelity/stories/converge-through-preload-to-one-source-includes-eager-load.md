---
title: "converge-through-preload-to-one-source-includes-eager-load"
status: ready
updated: 2026-07-16
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`converge-through-preload-collection-single-query-dedup` (PR #4911) converged
the through-preload's source join onto a single branch in
`packages/activerecord/src/associations/preloader/through-association.ts`
`_buildThroughScope`, deleting the per-predicate through-vs-source
classification. It left ONE implementation deviation from Rails' `through_scope`
(`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:117-143`),
which always joins the source via `includes!`/`references!` for every source
kind:

- a **to-many** source (collection / nested through) is joined via
  `includes!`/`references!` (eager-load, JoinDependency PK-dedup) — matches Rails.
- a **to-one** source (belongs_to / has_one, e.g. a HABTM's belongs_to) is
  joined via a plain `leftOuterJoins` instead.

### Root cause (verified)

The JoinDependency is NOT the problem — `jd.addAssociationSpec("<habtm
belongs_to>")` succeeds and `applyJoinDependency(true).toSql()` emits the correct
`LEFT OUTER JOIN "developers" ON ...`. The failure is in the `.toArray()`
eager-load path: `Relation#_eagerLoadBypassesJoinDependency`
(`packages/activerecord/src/relation.ts:3104`) returns true for
`Array.isArray(basePk)` — i.e. for ANY base model with a **composite primary
key** — and then `_executeEagerLoad` degrades to plain SQL + separate preload,
never applying the eager JOIN. A HABTM join model (`developers_projects`) always
has a composite PK (`["project_id","developer_id"]`), so its source `includes`
is copied onto an unjoined query and the copied `where("developers.name = ?")`
raises `no such column`. Reproduced by `EagerAssociationTest > preloading has
many through with custom scope` (`developersNamedDavidWithHashConditions`).

The composite-PK bypass exists because the eager LIMIT/OFFSET id-materialization
(`distinct_relation_for_primary_key` / `_materializeLimitedIds`) has no
composite-PK support (0023 deviation `composite-pk-distinct-relation-
materialization`). But that limitation only bites a **limited** eager load — a
non-limited composite-PK eager load JOINs fine (verified: narrowing the bypass to
`this._ctes.length > 0 || !this._fromClause.isEmpty()` makes the HABTM
`includes` resolve, breaking only `preloading has_many with cpk`, which is the
limited/pluck path that genuinely needs the materialization).

Results are correct today (the to-one join adds no rows; `_dedupByPrimaryKey`
neutralizes any nested-include fan-out), but the two-mode branch survives only
because of this bypass.

## Acceptance criteria

- [ ] Narrow `_eagerLoadBypassesJoinDependency` so a composite base PK only
      bypasses the eager JoinDependency when the query actually needs the
      composite-PK id-materialization (a LIMIT/OFFSET over a to-many eager join),
      not unconditionally — so a non-limited composite-PK eager `includes`
      applies the LEFT OUTER JOIN. Keep `preloading has_many with cpk` green.
- [ ] With that fixed, delete the `sourceIsToMany` branch in
      `_buildThroughScope`: join every source kind via `includes!`/`references!`
      (Rails-faithful), keeping `_dedupByPrimaryKey`.
- [ ] No regression in the has_one/has_many/nested-through, eager-loading, HABTM,
      composite-PK, and through-association-scope suites (esp. `preloading has
    many through with custom scope` and `preloading has_many with cpk`).
