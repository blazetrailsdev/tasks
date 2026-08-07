---
title: "delete-nested-attributes-deferred-displacement"
status: done
updated: 2026-08-07
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: ["migrate-nested-attributes-assignments-to-awaitable-writer"]
deps-rfc: []
est-loc: 400
priority: 9
pr: 6167
claim: "2026-08-07T02:28:27Z"
assignee: "api-compare-orphan-buckets-activesupport-core-ext-tail"
blocked-by: null
closed-reason: null
---

## Context

Once no caller reaches the synchronous nested-attributes setter
(`migrate-nested-attributes-assignments-to-awaitable-writer`), RFC 0087 §1
deletes it and the deferred-displacement machinery that exists only to serve it:

- the `Object.defineProperty(modelClass.prototype, attrName, ...)` setter arm in
  `generateAssociationWriter` (`packages/activerecord/src/nested-attributes.ts`);
- `detachDisplacedAtAssignment`, `parkDisplacedRemoval`,
  `recordDisplacedRemovalFailure`, `awaitPendingDisplacedRemovals` and the
  `_pendingDisplacedRemovals` / `_displacedRemovalFailure` owner state
  (`nested-attributes.ts`);
- `HasOneAssociation#prepareDetachDisplacedForSyncBuild` and
  `findThenDetachDisplaced`
  (`packages/activerecord/src/associations/has-one-association.ts`), plus the
  `HasOneThroughAssociation` override
  (`associations/has-one-through-association.ts:211`).

This is the story RFC 0068's `eliminate-sync-build-displacement-target-swap`
(PR #5990) deferred to: with the writer awaitable, the unloaded arm runs
`load_target` -> `remove_target!` -> `self.target = record` in Rails' order
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84`)
with no target swap and nothing parked. It supersedes
`0068-awaitable-has-one-setter/stories/retire-nested-attributes-sync-setter-displacement`,
which scoped only the displacement contract.

## Acceptance criteria

- [ ] The `#{name}Attributes=` property setter is gone; `set#{Name}Attributes`
      is the only nested-attributes writer.
- [ ] `findThenDetachDisplaced`, `prepareDetachDisplacedForSyncBuild` and the
      `_pendingDisplacedRemovals` / `_displacedRemovalFailure` state are deleted.
- [ ] The unloaded displacement runs in Rails' order inside the awaitable
      writer — no swap, no parked promise.
- [ ] `has-one-sync-build-displacement.trails.test.ts` and
      `nested-attributes-displaced-removal-failure.trails.test.ts` cover the new
      contract (or are deleted where the contract they pinned is gone).
- [ ] RFC 0068 Design §6 is updated to record that its accepted deviation is
      retired here.
