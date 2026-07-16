---
title: "converge-through-preload-to-one-source-includes-eager-load"
status: claimed
updated: 2026-07-16
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-16T19:51:14Z"
assignee: "converge-through-preload-to-one-source-includes-eager-load"
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
- a **to-one** source (belongs*to / has_one, e.g. a HABTM's belongs_to) is
  joined via a plain `leftOuterJoins` instead, because trails' eager-load can't
  join that reflection: `includes("<habtm belongs_to>").references("developers")`
  on the anonymous `HABTM*\*`join model returns`\_eagerLoadingForSql() === true`but`\_executeEagerLoad`falls back to preload (no JOIN), leaving the copied`where("developers.name = ?")`against an unjoined table →`no such column`.
Reproduced by `EagerAssociationTest > preloading has many through with custom
  scope` (`developersNamedDavidWithHashConditions`).

Results are correct today (the to-one join adds no rows; `_dedupByPrimaryKey`
neutralizes any nested-include fan-out), but the two-mode branch survives only
because of this eager-load gap.

## Acceptance criteria

- [ ] `includes(<belongs_to on an anonymous HABTM_* join model>).references(<table>)`
      followed by `.toArray()` applies the eager LEFT OUTER JOIN (does not fall
      back to preload), so a copied `where("<source_table>.col = ?")` resolves.
- [ ] With that fixed, delete the `sourceIsToMany` branch in
      `_buildThroughScope`: join every source kind via `includes!`/`references!`
      (Rails-faithful), keeping `_dedupByPrimaryKey`.
- [ ] No regression in the has_one/has_many/nested-through, eager-loading, HABTM,
      and through-association-scope suites (esp. `preloading has many through with
custom scope`).
