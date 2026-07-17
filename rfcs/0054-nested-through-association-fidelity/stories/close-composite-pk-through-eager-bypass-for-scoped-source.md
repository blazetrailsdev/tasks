---
title: "close-composite-pk-through-eager-bypass-for-scoped-source"
status: blocked
updated: 2026-07-17
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps:
  - converge-through-preload-to-one-source-includes-eager-load
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-17T01:31:15Z"
assignee: "close-composite-pk-through-eager-bypass-for-scoped-source"
blocked-by: "Built on PR #4917 (converge-through-preload-to-one-source-includes-eager-load), still in-progress/unmerged. Acceptance criteria reference the _throughQueryJoinsSource degraded branch and narrowed _eagerLoadBypassesJoinDependency that #4917 introduces; neither exists in main. Cannot proceed without stacking on an unmerged branch."
closed-reason: null
---

## Context

`converge-through-preload-to-one-source-includes-eager-load` (PR #4917)
converged the through-preload source join in
`packages/activerecord/src/associations/preloader/through-association.ts`
`_buildThroughScope` onto Rails' single `through_scope` branch: copy the full
reflection `where_clause` and eager-JOIN the source via
`includes!`/`references!`
(`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:117-141`).

That JOIN only materializes when trails applies the eager JoinDependency. For a
composite-PK, non-HABTM through model, `Relation#_eagerLoadBypassesJoinDependency`
(`packages/activerecord/src/relation.ts`) degrades eager loads to preload
(a trails capability gap — Rails always JOINs). PR #4917 added a degraded branch
(`_throughQueryJoinsSource()` false): copy ONLY the through-table-only predicates
onto the through query and let source-table predicates ride the recursive source
stage (`_getSourcePreloaders`).

Residual gap (flagged in review): a single predicate referencing BOTH the
through table AND the source table (e.g. `posts.title = ? OR
categorizations.author_id = ?`) is `!predicateIsThroughOnly`, so it stays on the
source stage — which never joins the through table → `no such column`. No
two-step decomposition can resolve a predicate spanning two tables that are never
joined together; only Rails' single-query JOIN can. The same limitation exists in
the long-standing collection `twoStep` split. Empirically, removing the
composite-PK bypass entirely breaks `EagerAssociationTest > preloading has_many
with cpk` (the eager JOIN builder can't emit a real CPK collection JOIN), so the
faithful fix is to make the eager JOIN builder handle a composite-PK base rather
than to keep splitting.

This case is currently UNREACHABLE in the canonical suite (no canonical
association routes a scoped source through a composite-PK non-HABTM model), so
there is no live regression — this is a latent-fidelity convergence.

## Acceptance criteria

- [ ] `Relation#_eagerLoadBypassesJoinDependency` no longer bypasses a
      composite-PK base when the eager specs are JoinDependency-emittable
      (belongs_to / has_one / has_many the `_buildEagerJoinManager` /
      `_materializeLimitedIds` composite paths already support), keeping
      `preloading has_many with cpk` green.
- [ ] With the bypass closed for the through case, delete the degraded
      `_throughQueryJoinsSource()` branch in `_buildThroughScope` and the
      corresponding `&& this._throughQueryJoinsSource()` guard in
      `_getSourcePreloaders` — every source kind (including a scoped source
      through a composite-PK non-HABTM model) resolves via the single JOIN, so a
      mixed through/source predicate resolves too.
- [ ] Add coverage for a scoped source through a composite-PK non-HABTM model
      with a mixed through+source predicate (canonical CPK models + a
      Rails-faithful scope if one exists; otherwise a `*.trails.test.ts`).
- [ ] No regression in eager, CPK-eager, HABTM, has_many/has_one-through,
      nested-through, and through-association-scope suites.
