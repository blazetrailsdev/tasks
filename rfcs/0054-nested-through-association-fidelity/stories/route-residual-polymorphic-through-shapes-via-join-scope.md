---
title: "route-residual-polymorphic-through-shapes-via-join-scope"
status: claimed
updated: 2026-07-08
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 21
pr: null
claim: "2026-07-08T19:22:35Z"
assignee: "route-residual-polymorphic-through-shapes-via-join-scope"
blocked-by: null
closed-reason: null
---

## Context

After #4744 (composite read-scope routing) and #4747 (composite write-path
`construct_join_attributes` + guard removal), the only shapes still falling to
`CollectionProxy#_buildThroughScope`'s single-column IN-subquery fallback
(`packages/activerecord/src/associations/collection-proxy.ts:~3636`) are the
ones `_routeThroughViaAssociationScope` declines
(`packages/activerecord/src/associations.ts:805-818`):

- **polymorphic has_many / has_one source** — the chain walker needs inversion
  machinery not present in `AssociationScope.nextChainScope`; the fallback's
  composite backstop `ConfigurationError`s (collection-proxy.ts:3699/3714/3766)
  are only reachable via this shape.
- **polymorphic belongsTo source without `sourceType`** — invalid in Rails for
  `has_many :through` (`HasManyThroughAssociationPolymorphicSourceError`), so
  the JOIN can't pick a single target table; this may simply be converted to a
  raise rather than routed.

Rails routes both through the generic chain-based `AssociationScope`
(`association_scope.rb` `add_constraints`), so converging means extending
`buildThroughJoinScope` / `_canRouteThroughViaAssociationScope` to cover them
and deleting the IN-subquery fallback + its backstop composite guards.

## Acceptance criteria

- `_canRouteThroughViaAssociationScope` accepts polymorphic-has_many/has_one
  sources and routes them through `buildThroughJoinScope`.
- polymorphic-belongsTo-source-without-`sourceType` `has_many :through` raises
  Rails' `HasManyThroughAssociationPolymorphicSourceError` (or the trails
  equivalent) rather than a bespoke IN-subquery `ConfigurationError`.
- The single-column IN-subquery fallback in `_buildThroughScope` and its
  composite backstop `ConfigurationError`s are deleted once no shape reaches it.
- api:compare and test:compare deltas stay non-negative; no test renames.
