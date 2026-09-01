---
title: "update/update! call setAttributes where Rails calls assign_attributes"
status: in-progress
updated: 2026-09-01
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: 7359
claim: "2026-09-01T20:39:56Z"
assignee: "update-must-call-assign-attributes-not-set-attributes"
blocked-by: null
closed-reason: null
---

## Context

`update` and `update!` (`packages/activerecord/src/persistence.ts`) call
`setAttributes`, not `assignAttributes`. Rails calls `assign_attributes`:

```ruby
# activerecord/lib/active_record/persistence.rb#update
def update(attributes)
  with_transaction_returning_status do
    assign_attributes(attributes)
    save
  end
end
```

`parity:api:calls` flags both as omitting `assign_attributes`; PR #7303
suppressed them with a `@missingRailsCall` receipt at each call site rather
than a baseline row.

Two problems with the receipts as they stand:

1. They read
   `@missingRailsCall assign_attributes — CONVERGEABLE grep-gate-sync-association-writers-to-zero`,
   and that story is already **done**. A CONVERGEABLE receipt pointing at a
   landed story has no live convergence target. (`scripts/stale-story-references.ts`
   does not currently red on this — verified on main at 6cdc8f79a — so this is
   a correctness-of-the-ledger issue, not a broken build.)
2. The receipts should be deleted, not re-pointed, once the blocker is gone.

The blocker: `assignAttributes` is synchronous since #7303 (Ruby's
`assign_attributes` returns nil, `activemodel/lib/active_model/attribute_assignment.rb:28-36`),
and association writers still perform I/O at assignment
(`collection_association.rb:46-48`, `has_one_association.rb:59-84`), so
`update({ account: x })` would raise on the sync surface.

## Converged shape

Once no association writer owes I/O at assignment, route `update` / `update!`
back through `assignAttributes` and **delete both `@missingRailsCall`
receipts** — do not re-point them at a newer story.

Until then, re-point the two receipts at THIS story id so the ledger names a
live target.

## Acceptance criteria

- [ ] `update` and `update!` call `assignAttributes`, matching
      `persistence.rb#update` / `#update!`.
- [ ] Both `@missingRailsCall assign_attributes` receipts in `persistence.ts`
      are gone, not reworded.
- [ ] `pnpm parity:api:calls` green with no new baseline row.
- [ ] The has_one/collection mass-assignment tests in
      `packages/activerecord/src/associations/` stay green.
