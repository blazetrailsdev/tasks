---
title: "through-scope-join-route-composite-and-residual-shapes"
status: ready
updated: 2026-06-26
rfc: "0005-activerecord-gaps"
cluster: null
deps:
  - converge-integration-namedscoping-remainder
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`CollectionProxy#_buildThroughScope`
(`packages/activerecord/src/associations/collection-proxy.ts`) still hand-builds
a non-Rails `id IN (SELECT source_fk …)` subquery for through/HABTM scopes that
`AssociationScope` cannot route. PR #3546 narrowed the divergence by delegating
the common case (scalar PK + a shape `_canRouteThroughViaAssociationScope`
accepts) to `buildThroughJoinScope` (the JOIN-based `AssociationScope` relation
the loader runs), but explicitly keeps the IN-subquery fallback for:

- composite owner/target primary keys (gated off the JOIN route at
  collection-proxy.ts ~2788; the single-column IN-subquery can't express a
  composite key and raises trails-only `ConfigurationError`s),
- nested-through,
- polymorphic-has_many sources,
- polymorphic-belongsTo sources without `sourceType`.

Rails has no such branch: `CollectionAssociation#scope` is always
`target_scope.merge!(association_scope)` with
`association_scope = AssociationScope.scope(self)` — one JOIN-based path for
every shape, including composite-PK `has_many :through` (which Rails supports
and trails currently rejects with `ConfigurationError`).

The composite-key gate in PR #3546 is therefore ratifying a deviation, not
converging: the two tests it keeps green
(`associations.test.ts:1596`, `:1659`/`:1677`) assert a trails limitation, not
Rails behavior. See the "always converge, never ratify" principle.

## Acceptance criteria

- `AssociationScope` / `buildThroughJoinScope` handle composite-PK
  through/HABTM scopes, so `_buildThroughScope` can route them through the JOIN
  path and the trails-only composite `ConfigurationError` guards are removed.
- Where feasible, extend `_canRouteThroughViaAssociationScope` (and the JOIN
  route) to cover the remaining IN-subquery-only shapes (nested-through,
  polymorphic-has_many, polymorphic-belongsTo without sourceType), shrinking or
  deleting the bespoke IN-subquery fallback in `_buildThroughScope`.
- The composite-PK construction tests are converted to assert Rails behavior
  (the JOIN scope / correct results) rather than the `ConfigurationError`
  throw — after reading the corresponding Rails tests. No test renames.
- api:compare and test:compare deltas stay non-negative.
- No stubs; no `node:` imports; no `process` references; async fs only; no new
  runtime deps.
