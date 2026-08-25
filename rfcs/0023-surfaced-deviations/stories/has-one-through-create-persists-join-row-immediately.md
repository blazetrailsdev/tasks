---
title: "has_one_through build/create on persisted owner defers join-row write to save() instead of persisting immediately"
status: closed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Invalid premise: Rails create_club/build also defers the join-row write to owner.save() (verified empirically against vendor/rails — Membership.count=0 and current_membership.new_record?=true after create_club with no save; only the writer club= persists immediately via replace(record, save=true)). trails already matches Rails: create defers, writer persists. Implementing 'persist immediately on create' would introduce a deviation from Rails, not converge. No code change warranted."
---

## Context

Surfaced while landing `has-one-through-build-persisted-owner-unloaded-row-reconcile`
(PR #4494). Rails' `create_through_record`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb:15-40`)
runs synchronously inside `replace`, so `member.create_club` on a **persisted**
owner immediately persists the join row (`through_proxy.create(attributes)` /
`through_record.update(attributes)`) — the returned state is fully written with
no `owner.save` needed.

trails defers the join-row write to the owner's next `save()`: the sync write
path (`constructThroughRecordInMemory` →
`packages/activerecord/src/associations/has-one-through-association.ts`) builds
the join record in memory and queues `_pendingReplace`, and the actual
create/update/destroy happens only in `persistReplace`
(`flushPendingReplaces`, run post-commit on owner `save`). PR #4494's
`create`-path test had to add an explicit `refetched.save()` that the Rails body
(`create_club` alone) does not need — direct evidence of the gap.

This is the `create`/`build` analog of the (blocked, superseded)
`has-one-writer-persist-on-assignment` deviation, which covers only the
assignment/writer path. The has_one_through **writer** already persists
immediately (`writer()` returns `persistReplace()` for a persisted owner), but
the association-level `build`/`create` (`_createRecord` → `setNewRecord` →
`replace(record, false)`) still defers.

Rails: `has_one_through_association.rb` (`create_through_record` →
`through_proxy.create` / `through_record.update`).
trails: `has-one-through-association.ts` (`replace`,
`constructThroughRecordInMemory`, `persistReplace`, `createThroughRecord`);
`singular-association.ts` (`_createRecord`); `has-one-association.ts`
(`setNewRecord` → `replace(record, false)`).

## Acceptance criteria

- [ ] `member.association("club").create(...)` / `create_club` on a persisted
      owner persists the join row immediately (existing row `update`d or a new
      row `create`d) without requiring a subsequent `owner.save()`, matching
      Rails `create_through_record`.
- [ ] Persist the async immediate write without floating promises (the
      `_createRecord` path is already async; return/await the join-row write
      there rather than deferring to `flushPendingReplaces`).
- [ ] No regression in the has_one_through build/create, unloaded/loaded-row
      reconcile, nil-stale, or autosave suites.
- [ ] Update the `create`-path test in `has-one-through-associations.test.ts` to
      drop the added `refetched.save()` once create persists immediately.
