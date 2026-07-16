---
title: "has-one-unloaded-displacement-create-window"
status: claimed
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-16T01:41:10Z"
assignee: "has-one-unloaded-displacement-create-window"
blocked-by: null
closed-reason: null
---

## Context

Follow-up discovered during review of PR #4832 (d2-has-one-replacement-failure).
Pre-existing `queueWrite` deferral debt, not introduced by that PR.

When a has_one is **unloaded** and a deferred `pirate.ship = other`
(`HasOneAssociation#queueWrite`,
`packages/activerecord/src/associations/has-one-association.ts`) runs on a
persisted owner, `_removeDisplacedFromDb = true` is set (there is no in-memory
target to record, but a DB row keyed by the owner may exist). If
`pirate.createShip()` then runs before the owner is saved, `_createRecord`
inserts a new FK-matching row and sets it as the target. At the owner's next
save, `removeDisplaced`'s FK re-query (has-one-association.ts:~201) returns
whichever of the two FK-matching rows the DB yields first; if it returns the
just-created row, `removeDisplaced`'s `!sameRecord(found, savedTarget)` guard
(has-one-association.ts:~206) cancels, and the **old** DB ship stays attached.

Rails has no such window: `HasOneAssociation#replace` removes the old row
synchronously at assignment (`has_one_association.rb:66-84`), so the old ship is
already detached before `create_ship` runs.

The root cause is the JS property setter's inability to `await`, which forces
`queueWrite` to defer removal to save-time instead of performing it inline like
Rails. This story tracks tightening the unloaded-displacement path so the old
DB row is detached deterministically (e.g. capture its identity at
`queueWrite`/`_createRecord` time rather than re-querying by FK at save).

## Acceptance criteria

- [ ] Deferred `owner.child = x` on an unloaded has_one, followed by
      `owner.createChild()` before save, deterministically detaches the prior DB
      row (FK nulled / destroyed per `:dependent`) at the owner's save,
      regardless of DB row ordering.
- [ ] Add a test reproducing the unloaded-displacement + create window and
      asserting the old row is detached.
- [ ] No regression in the has_one / has_one_through / autosave suites.
