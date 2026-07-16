---
title: "has-one-unloaded-displacement-writer-window"
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

Discovered while fixing `has-one-unloaded-displacement-create-window` (PR #4901).
That PR closed the window on the `create#{name}` path by flushing the pending
displacement inside `HasOneAssociation#_createRecord`
(`packages/activerecord/src/associations/has-one-association.ts`). The same
window remains on the **awaitable writer** path, which PR #4901 deliberately
left out of scope.

Sequence: on a persisted owner whose has*one is **unloaded**, the sync property
setter (`owner.account = a`) runs `queueWrite`, which sets
`_removeDisplacedFromDb = true` (has-one-association.ts:~93). A subsequent
`await owner.association("account").writer(b)` (the awaitable path documented at
`builder/has-one.ts:90`) enters `writeImmediate`. Its leading `load_target`
mirror is skipped because `queueWrite`'s `replace` already called `loadedBang()`,
so `displaced` is the \_unsaved* `a` and `persistImmediate`'s `removeTargetBang`
no-ops. `b` is then persisted. The old DB row is never removed, and
`_removeDisplacedFromDb` is still set, so removal falls through to the owner's
save, where `removeDisplaced`'s FK re-query (has-one-association.ts:~201) now has
two FK-matching rows (the old row and `b`) and picks whichever the DB yields
first. If it returns `b`, the `!sameRecord(found, savedTarget)` guard
(has-one-association.ts:~206) cancels and the **old** row stays attached.

Currently masked on SQLite, which happens to return the older row first — probed
with the sequence above: old row's FK ends null and the attached count is 1, i.e.
it passes by ordering luck, not by construction. Same root cause as #4901: the JS
property setter cannot `await`, so `queueWrite` defers removal instead of doing
it inline like Rails' `HasOneAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:66-84`),
which removes the old record synchronously at assignment.

Likely fix, mirroring #4901: have `writeImmediate` / `persistImmediate` consult
`_displacedRecord` / `_removeDisplacedFromDb` and flush the pending displacement
(it is already async, so it can `await` the re-query) instead of relying on the
in-memory `displaced` alone.

## Acceptance criteria

- [ ] A deferred `owner.child = a` on an unloaded has_one, followed by
      `await owner.association("child").writer(b)`, detaches the prior DB row
      (FK nulled / destroyed per `:dependent`) deterministically, regardless of
      DB row ordering — asserted before the owner's save, as in #4901's test.
- [ ] Test pins the ordering rather than the DB's row order: assert the old row
      is detached at the point Rails' `replace` would have detached it. (An
      assertion made only after the owner's save passes even on unfixed code.)
- [ ] No regression in the has_one / has_one_through / autosave suites.
