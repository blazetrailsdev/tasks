---
title: "reload must re-point association owner to self after adopting fresh's @association_cache"
status: done
updated: 2026-06-15
rfc: "0022-singular-association-holder"
cluster: null
deps: ["fold-three-association-maps-into-one"]
deps-rfc: []
est-loc: 60
priority: null
pr: 3379
claim: "2026-06-15T17:18:27Z"
assignee: "reload-association-owner-repoint-on-cache-convergence"
blocked-by: null
---

## Context

Surfaced during PR #3279 (`destroy-reload-association-cache-clear-semantics`).

Rails `reload` does two things to the association cache
(`active_record/persistence.rb:751-752`):

```ruby
@association_cache = fresh_object.instance_variable_get(:@association_cache)
@association_cache.each_value { |association| association.owner = self }
```

It adopts the freshly-fetched object's cache **and re-points every adopted
association's `owner` back to `self`**.

Trails implements only the first half's _effect_: `reload` (`persistence.ts`)
resets the three split maps and adopts `fresh._preloadedAssociations`. The
owner re-point is currently a **no-op by accident, not by design** — it is only
safe to skip because `_findRecord` populates just `_preloadedAssociations` with
raw, ownerless target records, never owner-bound `Association` objects.

Once [[fold-three-association-maps-into-one]] converges the three maps into a
single `@association_cache` slot of owner-bound `Association` objects, `reload`
**must** re-point `owner = self` over the adopted cache, or reloaded records
will carry associations owned by the discarded `fresh` object.

Concrete blocker to wire first: `CollectionProxy.owner` is a read-only getter
(`associations/collection-proxy.ts:200`, backed by `_record`), whereas Rails'
`Association#owner` is settable and `reload` mutates it. The convergence must
make the owner reassignable before the re-point can be implemented.

## Acceptance criteria

- [ ] `reload` re-points `owner` to `self` over the adopted/converged
      association cache, mirroring `persistence.rb:752`.
- [ ] `CollectionProxy` (and any owner-bound holder) exposes a reassignable
      owner.
- [ ] No behavior change for the current preloaded-only path; all suites pass;
      no test renames.
