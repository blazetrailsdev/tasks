---
title: "has-one-through-unloaded-displacement-duplicate-join"
status: claimed
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-16T16:11:13Z"
assignee: "has-one-through-unloaded-displacement-duplicate-join"
blocked-by: null
closed-reason: null
---

## Context

Raised in review of PR #4901 (`has-one-unloaded-displacement-create-window`) as a
suspected through-path create-window; probing showed a **different and broader**
defect, so it is filed on its own terms.

Over an **unloaded** has_one_through on a persisted owner, assigning or creating a
new target INSERTS A SECOND JOIN ROW instead of updating the pre-existing one.
The stale join row survives, so the owner keeps a join to the old target and
which target `owner.child` reads back depends on DB row ordering.

Rails updates the existing join row rather than inserting
(`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb:29-38`,
`create_through_record`):

```ruby
through_record = through_proxy.load_target
...
if through_record
  if through_record.new_record?
    through_record.assign_attributes(attributes)
  else
    through_record.update(attributes)   # <- UPDATE, not a second INSERT
  end
elsif owner.new_record? || !save
  through_proxy.build(attributes)
else
  through_proxy.create(attributes)
end
```

Our `HasOneThroughAssociation#replace`
(`packages/activerecord/src/associations/has-one-through-association.ts:132`)
cannot `await` (sync setter), so it queues `_pendingReplace` and sets
`_pendingUnloadedThroughReconcile = true` (:280) precisely so `persistReplace`
can "reset the proxy and re-read the join row from the DB, then reconcile
(update existing / create when absent)" (:265-272). That reconcile is not
achieving the update arm — a duplicate row is inserted instead.

Probed on `Member.hasOne("club", { through: "currentMembership" })`
(member.ts:80), canonical `members`/`clubs`/`memberships`. Given a member with an
existing `Membership` to club OLD, re-found so the through is unloaded:

| sequence                                                | join rows | stale OLD join present |
| ------------------------------------------------------- | --------- | ---------------------- |
| `m.club = A; await m.save()`                            | 2         | yes                    |
| `m.club = A; await m.createClub({...}); await m.save()` | 2         | yes                    |
| `await m.createClub({...}); await m.save()`             | 2         | yes                    |

Expected per Rails in every row: **1** join row, pointing at the new club.

Note the defect is independent of `create#{name}` — the setter-only sequence
leaks identically, so this is NOT the create-window PR #4901 fixed on the direct
has_one, and #4901's `_createRecord` flush is unrelated (a through's `queueWrite`
sets neither `_displacedRecord` nor `_removeDisplacedFromDb`, so that flush
correctly no-ops here).

Note also that `has-one-through-association.ts:147` calls
`(record as any)?.hasChangesToSave?.()` on what is a **getter** (base.ts:5178),
which throws once truthy — it sits on this exact path and is tracked separately
by `has-changes-to-save-getter-called-as-method`. Landing that first may change
which branch of `replace` this path takes, so sequence the two.

## Acceptance criteria

- [ ] Assigning or creating a new target over an unloaded has_one_through on a
      persisted owner leaves exactly ONE join row, pointing at the new target —
      matching `create_through_record`'s `through_record.update(attributes)` arm
      (has_one_through_association.rb:29-38).
- [ ] The pre-existing join row to the old target is gone (updated in place, not
      duplicated), so `owner.child` does not depend on DB row ordering.
- [ ] Tests cover all three probed sequences: setter-only, setter-then-create,
      and create-only.
- [ ] No regression in the has_one / has_one_through / autosave suites.
