---
title: "has-one-displaced-record-multi-slot"
status: ready
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
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

`HasOneAssociation._displacedRecord` (packages/activerecord/src/associations/
has-one-association.ts) is a **single slot**, but a has_one owner can displace
more than one persisted record before its `save()` drains the queue. The second
displacement overwrites the first, and the first record's FK is never nullified.

Rails has no queue: `HasOneAssociation#replace`
(vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb
:59-85) runs `remove_target!` (:69) inline on every assignment, so each displaced
record is removed as it is displaced. trails defers because the JS property
setter and the sync `build` cannot `await`; the deferral is what collapses N
displacements into one slot.

Reproduced on the pure `queueWrite` path — no `build` involved, so this predates
PR #4899:

```ts
const pirate = await Pirate.create({ catchphrase: "Arrr" });
const a = await Ship.create({ name: "A", pirate_id: pirate.id });
await pirate.loadHasOne("ship");
const b = await Ship.create({ name: "B" });
const c = await Ship.create({ name: "C" });
pirate.ship = b; // displaces A (persisted) -> _displacedRecord = A
pirate.ship = c; // displaces B (persisted) -> _displacedRecord = B, A lost
await pirate.save();
// A.pirate_id is still the pirate's id; Rails nullified it at the first replace.
```

PR #4899 made `setNewRecord` (the `build` path) queue onto the same slot, so
`owner.ship = otherPersistedShip; owner.buildShip(...)` now hits the same defect.
That PR gates its queueing on `displaced.isPersisted()`, which defends only the
unsaved-interim case (`owner.x = newA; owner.buildX(...)`) — two _persisted_
displacements still clobber. Raised in review of #4899 (comment 3) and
deliberately left to this story to keep #4899 scoped to `set_new_record`.

Note `queueWrite` also has a revert-cancel rule (`owner.x = other; owner.x =
original` cancels the removal, has-one-association.ts:68-74) that a list must
preserve — cancelling removes just that record from the pending set.

## Acceptance criteria

- [ ] `_displacedRecord` becomes an ordered collection; every persisted record
      displaced before the owner's `save()` is removed, in displacement order.
- [ ] `removeDisplaced()` drains the whole collection, running `removeTargetBang`
      per record with the reflection's `:dependent` (delete/destroy/else-nullify).
- [ ] The revert-cancel rule still cancels only the reverted record's removal.
- [ ] `autosave-association.ts:503` guards on emptiness, not truthiness — an
      empty array is truthy and would fire `removeDisplaced` on every save.
- [ ] `reset()` clears the collection.
- [ ] Test: two persisted displacements via the writer path both get nullified.
- [ ] Test: writer-then-build displacement (both persisted) both get nullified.
- [ ] No regression in has_one / has_one_through / autosave suites.
