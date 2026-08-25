---
title: "_explicitTarget must be raised by hand at every singular seeding site"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: _explicitTarget (association.ts:76) has no Rails counterpart, and the ask is to make raising it robust by centralizing it — hardening a trails invention rather than removing it. Convergence here means deleting the flag so setInverseInstance is just inversed_from, not funnelling more sites into it."
---

## Context

`_explicitTarget` (`packages/activerecord/src/associations/association.ts:76`)
is a trails-only flag with no Rails counterpart: the inner singular loaders
short-circuit on `isLoaded() && _explicitTarget` via `_loadedSingularTarget`
(`packages/activerecord/src/associations.ts:642-647`), so a target seeded
WITHOUT the flag reads back as unset and re-queries. Rails needs nothing
equivalent — `set_inverse_instance` is just `inverse.inversed_from(owner)`
(`association.rb`).

The flag has to be raised by hand at every seeding site, and the sites are
scattered:

- `_cacheSingularTarget` (`associations.ts:596`) — raises it
- `seed-association-cache.ts:29,39` — raises it
- `Association#setInverseInstance` (`association.ts:411`) — did NOT raise it
  until PR #5767

PR #5767 hit this directly: rerouting `CollectionProxy#push` onto
`CollectionAssociation#concat` moved inverse wiring from the proxy's
`_setCollectionInverseInstance` → `_cacheSingularTarget` path (flag raised) onto
`Association#setInverseInstance` (flag NOT raised). The symptom was remote from
the cause — `autosave-association.test.ts:683` `adding before save` failed
because `c.loadBelongsTo("firm")` re-queried and returned a different instance
than the in-memory owner. Fixed by raising the flag in `setInverseInstance`,
but the next seeding path added will reproduce it.

Note the raise is gated on `!inverse.isCollection()`, since `_explicitTarget`
is only consulted by the singular loaders.

Related: [[route-inverse-wiring-through-replace-on-target]].

## Acceptance criteria

- [ ] Raising `_explicitTarget` is not a per-call-site obligation: it is set by
      the one place that assigns an explicitly-seeded singular target (e.g.
      inside `inversedFrom` / a shared seed helper), so a new seeding path
      cannot forget it.
- [ ] All existing raise sites (`associations.ts:596`,
      `seed-association-cache.ts:29,39`, `association.ts:411`) are collapsed
      onto that one mechanism rather than left as duplicates.
- [ ] A regression test asserts a singular inverse seeded through
      `setInverseInstance` reads back from cache without a query; verified
      failing on a baseline that drops the flag.
- [ ] `autosave-association.test.ts` (`adding before save`) and the
      `strict-loading` / associations suites still pass.
