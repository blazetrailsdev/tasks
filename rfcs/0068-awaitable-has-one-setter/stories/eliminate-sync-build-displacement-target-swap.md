---
title: "Eliminate the target swap in the unloaded sync-build displacement path"
status: done
updated: 2026-08-03
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
pr: 5990
claim: "2026-08-03T16:58:43Z"
assignee: "eliminate-sync-build-displacement-target-swap"
blocked-by: null
closed-reason: null
---

## Context

`HasOneAssociation#findThenDetachDisplaced`
(`packages/activerecord/src/associations/has-one-association.ts`) is the
unloaded arm of the nested-attributes writer's `remove_target!`. PR #5663
removed the `pendingRemovalTarget` field, but this path still parks the
displaced record — now on `this.target` rather than a dedicated field:

```ts
const replacement = this.target;
const displaced = await this.doAsyncFindTarget();
if (!displaced || sameRecord(displaced, replacement)) return;
this.target = displaced;
const removal = this.detachDisplacedTarget();
this.target = replacement;
await removal;
```

The swap is atomic with respect to the event loop — `removeTargetBang` binds
`this.target` on entry, before its first `await`, so nothing can observe the
association caching the displaced record — but it is still a write Rails never
makes. Rails' `replace` runs `load_target` -> `remove_target!` ->
`self.target = record` in one synchronous pass
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84`),
so the target only ever moves forward.

The swap exists because the writer is a synchronous property setter
(`pirate.shipAttributes = {...}`): it must install the replacement before
returning, while the displacing SELECT is still in flight. The two other pieces
of that same deviation are `prepareDetachDisplacedForSyncBuild`'s thunk and the
owner-side `_pendingDisplacedRemovals` drain.

Real convergence needs the assignment itself to be awaitable — the writer would
run `load_target`, then `remove_target!`, then `self.target = record`, in Rails'
order, with no swap and nothing parked. `setShipAttributes` (the awaitable
writer) already exists and would need no swap; the Rails-named synchronous
setter is what forces it. Depends on how far RFC 0068 wants to push the
sync-setter deviation.

## Acceptance criteria

- [ ] Decide (and record in the RFC) whether the Rails-named synchronous
      `#{name}Attributes=` setter keeps its deferred-displacement contract or
      whether the awaitable writer becomes the only displacing path.
- [ ] If the deferral stays: document the swap as an accepted deviation at the
      call site and confirm no test can observe the intermediate target.
- [ ] If it goes: `findThenDetachDisplaced`'s swap and
      `prepareDetachDisplacedForSyncBuild`'s thunk are both deleted, and the
      unloaded arm runs `load_target` -> `remove_target!` ->
      `self.target = record` in Rails' order.
- [ ] `has-one-sync-build-displacement.trails.test.ts` and
      `nested-attributes-displaced-removal-failure.trails.test.ts` still cover
      whichever contract is chosen.
