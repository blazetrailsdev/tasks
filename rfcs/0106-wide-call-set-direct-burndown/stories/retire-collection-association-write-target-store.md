---
title: "Retire CollectionAssociation#_writeTargetStore — one @target seat"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6683
claim: "2026-08-18T00:44:19Z"
assignee: "converge-collection-target-setter-coercion-and-proxy"
blocked-by: null
closed-reason: null
---

# Retire `CollectionAssociation#_writeTargetStore` — one `@target` seat

## Context

`packages/activerecord/src/associations/collection-association.ts` carries a
private `_writeTargetStore(value)` alongside `set target`. It exists because
RFC 0022 makes the `CollectionProxy` the canonical has_many store, so the
association's `@target` seat is either `store._sharedTarget` (proxy exists) or
its own `_targetStore` field — and every Ruby `@target = …` ivar write has to
pick between them.

Rails has no such helper: `@target = []` (`collection_association.rb:89`),
`@target = merge_target_lists(find_target, target)` (`:274`) and
`@target = original_target` (`:422`) are bare ivar writes, and `target=`'s
`super` (`:290`, `:292`) is `Association#target=`'s `@target = record`
(`association.rb:103`). PR #6675 introduced the helper while converging
`target=`; it is the honest spelling of the two-seat store, not a
convergence.

Once the association and the proxy hold ONE seat, every `_writeTargetStore(x)`
call collapses back to `this.target = x` / `super.target = x` and the helper is
deleted.

## Converged shape

- One target seat shared by `CollectionAssociation` and `CollectionProxy` (the
  RFC 0022 endgame), reachable through the plain `target` accessor pair.
- `_writeTargetStore` deleted; its 7 call sites spell Ruby's `@target =`
  directly.
- `Association#target=` (`association.rb:103`) stays the only writer the
  subclass `super`s into.

## Acceptance criteria

- [ ] `_writeTargetStore` no longer exists in `collection-association.ts`.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new extra surface.
- [ ] Association/proxy suites green.
