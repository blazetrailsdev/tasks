---
title: "retire-nested-attributes-sync-setter-displacement"
status: closed
updated: 2026-08-03
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by 0087-awaitable-association-writers-only/delete-nested-attributes-deferred-displacement, which removes the sync setter entirely rather than only its displacement contract"
---

## Context

RFC 0068 Design §6 (added 2026-08-03) ratified the nested-attributes
`#{name}_attributes=` sync setter's deferred-displacement contract as an
accepted deviation, which leaves one write Rails never makes:
`HasOneAssociation#findThenDetachDisplaced`
(`packages/activerecord/src/associations/has-one-association.ts`) installs the
displaced record on `this.target` for the duration of `remove_target!` and then
restores the replacement. Rails' `replace` runs `load_target` ->
`remove_target!` -> `self.target = record` in one synchronous pass
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84`),
so its target only ever moves forward.

The swap exists solely because the Rails-named writer is a synchronous property
setter: it must install the replacement before returning, while the displacing
SELECT is still in flight. The awaitable `setShipAttributes`
(`nested-attributes.ts`, `generateAssociationWriter`) needs no swap — it can run
the load, the removal, and the target install in Rails' order. Retiring the sync
setter's displacement contract (throw, as Design §2 does for `owner.account =
x`, or otherwise route displacement through the awaitable writer only) deletes
`findThenDetachDisplaced`, `prepareDetachDisplacedForSyncBuild`'s thunk, and the
owner-side `_pendingDisplacedRemovals` / `_displacedRemovalFailure` drain.

The cost §6 named: `#{name}_attributes=` is reached from `assign_attributes` /
`update` / `create` with a hash of mixed keys, so a throw is not a local rewrite
but touches every mass-assignment site containing a nested key — including the
Rails-ported nested-attributes tests. That blast radius is why it is its own
story.

## Acceptance criteria

- [ ] `findThenDetachDisplaced` and its target swap are deleted.
- [ ] `prepareDetachDisplacedForSyncBuild`'s thunk is deleted; the unloaded arm
      runs `load_target` -> `remove_target!` -> `self.target = record` in Rails'
      order on the awaitable path.
- [ ] `_pendingDisplacedRemovals` / `_displacedRemovalFailure` and their drain
      go with it, or the story records why they must stay.
- [ ] `has-one-sync-build-displacement.trails.test.ts` and
      `nested-attributes-displaced-removal-failure.trails.test.ts` cover the new
      contract; Rails-ported nested-attributes tests still pass.
- [ ] RFC 0068 Design §6 is updated to record the reversal.
