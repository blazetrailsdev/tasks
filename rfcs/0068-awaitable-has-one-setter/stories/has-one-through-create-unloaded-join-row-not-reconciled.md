---
title: "has-one-through-create-unloaded-join-row-not-reconciled"
status: done
updated: 2026-07-25
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5326
claim: "2026-07-25T21:58:52Z"
assignee: "has-one-through-create-unloaded-join-row-not-reconciled"
blocked-by: null
closed-reason: null
---

## Context

`create#{name}` on a **has_one_through** whose join row exists in the DB but is
UNLOADED leaves the join row pointing at the OLD target. The build counterpart
is covered and green
(`packages/activerecord/src/associations/has-one-through-associations.test.ts`,
"building works with has one through belongs to with unloaded existing join
row"): `build` + `save()` reconciles the existing `memberships` row via
`constructThroughRecordInMemory`, updating `club_id`.

The `create` path does not. A probe test written while porting
`replace`'s `load_target` into `HasOneAssociation#_createRecord`
(PR #5324, story has-one-create-record-unloaded-target-not-removed) showed:

- `Membership.where({ member_id }).count()` stays 1 (no duplicate join row), but
- `Membership.find(membershipId).club_id` still points at the OLD club, not the
  club just created by `refetched.association("club").create({...})`.

Rails' `HasOneThroughAssociation#create_through_record`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb:15-19`)
loads the through proxy and `update`s the existing join row, so the newly
created target should own the join row.

Out of scope for #5324, which is the direct-FK `has_one` unloaded-displacement
port; that PR's pre-load already routes the through subclass through
`loadTargetForBuild` (the through proxy), so the load is in place — the
reconcile after `create` is what is missing.

## Acceptance criteria

- [ ] `member.association("club").create({...})` on a refetched member with an
      unloaded existing `currentMembership` row updates that row's `club_id` to
      the newly created club (no duplicate join row).
- [ ] Regression test added to
      `packages/activerecord/src/associations/has-one-through-associations.test.ts`
      alongside "building works with has one through belongs to with unloaded
      existing join row"; must fail on baseline.
- [ ] has_one / has_one_through suites stay green; `parity:test` delta
      non-negative.
