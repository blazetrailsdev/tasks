---
title: "Retire the proxy-materialization step in _wireInverseAssociation"
status: claimed
updated: 2026-08-21
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: "2026-08-21T16:50:31Z"
assignee: "retire-the-proxy-materialization-step-in-wire-inverse-association"
blocked-by: null
closed-reason: null
---

# Retire the proxy-materialization step in `_wireInverseAssociation`

## Context

Surfaced landing PR #6819 (`retire-collection-proxy-append-bang-and-wire-inverse-target`).
That story deleted `CollectionProxy#_wireInverseTarget` and routed the has_many
arm of `_wireInverseAssociation`
(`packages/activerecord/src/associations.ts:553-575`) onto Rails' own
`inverse.inversed_from(owner)` — `Association#set_inverse_instance`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:132-137`)
sends `inversed_from` (`:153-155`), whose `self.target = record` reaches
`CollectionAssociation#target=`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:284-296`)
and so `replace_on_target(record, true, replace: true, inversing: true)` (`:294`).

Rails resolves the inverse with a bare `record.association(name)`
(`association.rb:120-124`, `inverse_association_for`). trails needs TWO calls
there:

    association(child, inverseName);                      // module fn — materializes the CollectionProxy
    (child.association(inverseName) as ...).inversedFrom(owner);

because a has_many's canonical target lives on its `CollectionProxy`
(`Base#_associationCache`, `packages/activerecord/src/base.ts:3024-3047`, which
prefers `_collectionProxies` over the `HasManyAssociation` mirror it calls "a
stale secondary copy"), while `inversed_from` must be sent to the association
object. Dropping the first call makes the seeded record invisible to readers —
it is what `_wireInverseTarget` used to do implicitly, and removing it reds
`replace-on-target-inversing.trails.test.ts` ("tracks a persisted record added
through the inversing path…").

The extra call is a symptom of the two-store split, not of anything Rails does:
in Ruby `@association_cache[name]` holds the Association and `CollectionProxy`
is just its `reader` (`collection_association.rb:32-41`), so there is one store
and one resolve.

## Converged shape

One resolve, as Rails has: `child.association(inverseName).inversedFrom(owner)`,
with the proxy's `_target` no longer a second canonical store — either the proxy
reads its target from the association it already resolves via
`_collectionAssociation()` (`collection-proxy.ts:650-652`), or
`_associationCache` stops preferring the proxy. The second call then disappears
because there is nothing left to materialize separately.

Note this is the same split RFC 0114 has been burning down elsewhere; the
`_wireInverseTarget` deletion removed the seam's writer, not the split itself.

## Acceptance criteria

- [ ] `_wireInverseAssociation`'s has_many arm makes exactly one
      `record.association(name)`-shaped resolve, as `inverse_association_for`
      does.
- [ ] `replace-on-target-inversing.trails.test.ts` and
      `inverse-associations.test.ts` (`InverseBelongsToTests` /
      `InversePolymorphicBelongsToTests` "with has many inversing …") stay green.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green, no new
      baseline row.
