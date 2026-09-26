---
title: "update/update! must call assignAttributes, not setAttributes (carried from RFC 0087)"
status: blocked
updated: 2026-09-26
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-09-26T00:02:02Z"
assignee: "float-seat-has-no-producer"
blocked-by: "The surviving I/O is Rails' own, not trails': HasOneAssociation#replace saves the record on a persisted owner (activerecord/lib/active_record/associations/has_one_association.rb:59-84, record.save at :76) and CollectionAssociation#ids_writer queries klass.where(pk => ids) then replace (collection_association.rb:65-84). Neither can be removed. Ruby runs both inside a synchronous assign_attributes (returns nil, activemodel/attribute_assignment.rb:28-36); JS has no synchronous await, so a void assignAttributes cannot complete them. Parking the promise for save to drain is banned. Converges only if assignAttributes may return a promise, which activemodel forbidden-attributes-protection.test.ts:57 (a ported Rails test asserting undefined) rules out."
closed-reason: null
---

## Context

Carried out of RFC `0087-awaitable-association-writers-only`, which was auto-closed
on 2026-09-01 when its last story (`update-must-call-assign-attributes-not-set-attributes`,
PR #7359) was marked done. That story shipped only the _interim_ step — it
re-pointed the receipts — and the convergence it names is still outstanding, so
the debt would otherwise have been dropped with the RFC.

`update` / `updateBang` (`packages/activerecord/src/persistence.ts:394,406`) call
`setAttributes` where Rails calls `assign_attributes`:

```ruby
# activerecord/lib/active_record/persistence.rb#update
def update(attributes)
  with_transaction_returning_status do
    assign_attributes(attributes)
    save
  end
end
```

Both sites carry
`@missingRailsCall assign_attributes — CONVERGEABLE update-must-call-assign-attributes-not-set-attributes`.
That story is now **done**, so — exactly the defect PR #7359 set out to fix — the
receipts once again name a landed story with no live convergence target. Re-point
both at THIS story id as part of the first PR that touches them, or delete them
outright if the convergence below lands in that same PR.

## The blocker (verified empirically, not assumed)

`assignAttributes` is synchronous — Ruby's `assign_attributes` returns nil
(`activemodel/lib/active_model/attribute_assignment.rb:28-36`) — and
`packages/activemodel/src/attribute-assignment.ts` enforces that via
`assertAssignedSynchronously`. The has_one and collection writers still perform
I/O at assignment
(`activerecord/lib/active_record/associations/has_one_association.rb:59-84`,
`collection_association.rb:46-48`), so routing `update` through `assignAttributes`
raises:

```text
RuntimeError: assignAttributes cannot assign this attribute synchronously;
use `await record.setAttributes(...)` instead.
```

Patching both bodies to `self.assignAttributes(attributes)` produces 5 failures:

- `packages/activerecord/src/associations/has-one-persisted-setter-throws.trails.test.ts`
  — `await firm.update({ account })`
- `packages/activerecord/src/associations/collection-awaitable-writers.trails.test.ts`
  — `await author.update({ postIds: [0] })`, `{ postIds: [first.id, second.id] }`

Note that every RFC 0087 story nominally responsible for removing that I/O
(`migrate-has-one-assignments-to-awaitable-writer`,
`delete-has-one-sync-property-setter`, `delete-collection-sync-writers`,
`retire-sync-association-mass-assignment-arms`) is already **done**, yet the
writers still return promises. So the remaining I/O is NOT covered by an open
story anywhere — establishing where it actually survives is the first task here,
not a precondition owned elsewhere.

## Converged shape

`update` / `updateBang` call `assignAttributes(attributes)` and both
`@missingRailsCall assign_attributes` receipts are **deleted, not reworded**.

## Acceptance criteria

- [ ] `update` and `update!` call `assignAttributes`, matching
      `persistence.rb#update` / `#update!`.
- [ ] Both `@missingRailsCall assign_attributes` receipts in `persistence.ts` are
      gone, not reworded and not re-pointed a third time.
- [ ] `pnpm parity:api:calls` green with no new baseline row.
- [ ] The has_one/collection mass-assignment tests in
      `packages/activerecord/src/associations/` stay green — in particular
      `has-one-persisted-setter-throws.trails.test.ts` and
      `collection-awaitable-writers.trails.test.ts`.
