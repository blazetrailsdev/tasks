---
title: "Singular-association holder + writer/reader migration"
status: ready
updated: 2026-06-10
rfc: "0022-singular-association-holder"
cluster: associations
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC 0006 left has_one / belongs_to targets in the generic `_cachedAssociations`
value-map (Option A). This story introduces the Rails-faithful holder so those
targets live on an association object reached through `record.association(name)`,
mirroring Rails `SingularAssociation` (`@target` + `@loaded`). See the RFC
"Singular holder" design section.

This is purely the holder + the singular write/read migration. Serialization,
counter-cache, validations, autosave, and the final field deletion are b2–b4.

## Acceptance criteria

- [ ] A `SingularAssociation`-style holder exists, memoized per record+name
      (reuse `_associationInstances` per RFC open question 1; do not add a new
      sibling map unless reuse is impossible).
- [ ] Holder exposes `target: Base | null` and `loaded: boolean` (loaded-nil
      distinguished from not-loaded).
- [ ] `setBelongsTo` (`associations.ts:2371`), `setHasOne`
      (`associations.ts:2422`), and the inverse-of seeders (`associations.ts:311`,
      `association-relation.ts:205`, `nested-attributes.ts:264`,
      `relation.ts:2536`) write the holder's target instead of
      `_cachedAssociations.set(...)`.
- [ ] `loadBelongsTo` (`associations.ts:817`) and `loadHasOne`
      (`associations.ts:968`) read `association(name).target` (with the existing
      `_preloadedAssociations` fallback) instead of `_cachedAssociations.get(...)`.
- [ ] `_cachedAssociations` is NOT yet deleted (b4); singular readers not yet
      migrated (b3) still see correct data — i.e. keep a transitional mirror or
      sequence so the suite stays green between stories.
- [ ] All association / autosave / nested-attributes / inverse / eager suites
      pass; no test renames.
- [ ] `api:compare` delta non-negative on `belongs_to_association.rb` /
      `has_one_association.rb` / `singular_association.rb`.

## Notes

Hazard: `createThroughAssociation` (`associations.ts:2040`) caches a single
through-target — decide whether it belongs to the holder or the proxy; it is a
has_many-through writer, so it likely seeds the proxy, not the singular holder.
Keep the loaded-nil semantics the inverse tests assert (`!== undefined` guards).
Rails source: `associations/singular_association.rb`,
`associations/belongs_to_association.rb`, `associations/has_one_association.rb`.
