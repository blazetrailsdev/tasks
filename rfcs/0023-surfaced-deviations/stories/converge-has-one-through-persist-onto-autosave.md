---
title: "converge-has-one-through-persist-onto-autosave"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
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

Follow-up surfaced while landing `converge-has-one-persist-onto-autosave-drop-pendingreplace`
(PR #4489), which converged the **direct** `HasOneAssociation` persistence onto
the single Rails `save_has_one_association` autosave path and retired its
`_pendingReplace`/`persistReplace` machinery.

`HasOneThroughAssociation` was intentionally left on its own deferred
`_pendingReplace` → `persistReplace` → `createThroughRecord` path (flushed
post-commit by `flushPendingReplaces`), because a through persists via a
join-model build/create/update/destroy rather than a direct foreign-key save on
the target. PR #4489 did simplify the through build path
(`constructThroughRecordInMemory` no longer queues on the through proxy's
`_pendingReplace`; the through proxy's own autosave persists lone built join
records), but the persisted-owner update/destroy arms still ride
`persistReplace`. That keeps the `autosaveHasOne` `_pendingReplace` skip guard
alive (now for through only) and `flushPendingReplaces` on the owner save path.

trails: `packages/activerecord/src/associations/has-one-through-association.ts`
(`replace`, `persistReplace`, `createThroughRecord`), `autosave-association.ts`
(`autosaveHasOne` through guard, `flushPendingReplaces`).
Rails: `vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb`,
`autosave_association.rb` (`save_has_one_association` `through_reflection` arm).

## Acceptance criteria

- [ ] Evaluate converging `HasOneThroughAssociation` persistence off its own
      `_pendingReplace`/`persistReplace` deferral onto the owner-save autosave
      path, so the `autosaveHasOne` `_pendingReplace` skip guard and
      (if no other user remains) `flushPendingReplaces` can be retired.
- [ ] Preserve the persisted-owner update/destroy-existing-join semantics
      (`createThroughRecord`'s update / destroy / create arms) and the
      immediate-persist-on-assignment behavior of the awaitable `writer`.
- [ ] No regression in has_one_through / autosave suites on sqlite + PG + MariaDB.
