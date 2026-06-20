---
title: "has_one writer queues until save (no floating promises), awaitable writer persists immediately"
status: claimed
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-20T18:25:29Z"
assignee: "has-one-writer-queue-until-save"
blocked-by: null
---

## Context

Re-scope of `has-one-writer-persist-on-assignment` (PR #3722, branch
`has-one-writer-persist-on-assignment-44db`, closed unmerged). That story's
acceptance criteria mandated persisting a `has_one` write **on assignment to a
saved owner** (`company.account = account` → immediate nullify/destroy +
save), matching Rails `HasOneAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-83`).

The problem: a JS property setter (`owner.account = x`) cannot `await`. To
persist on assignment, PR #3722 fired `persistReplace()` fire-and-forget from
the setter and parked the promise on `_pendingWrite` (awaited later by
`save()`, with a `.catch` to suppress unhandled rejection). The project owner
rejected this: **no floating promises**. It is also inconsistent with
`has_many`, whose `CollectionAssociation#writer` already _queues_ the change
(sets `_pendingReplace`) and persists it at the owner's next `save()` via
`flushPendingReplaces` — `setHasMany`/`idsWriter` are the only immediate paths,
and the property setter never floats.

## Desired design

Make `has_one` consistent with `has_many` and floating-promise-free:

- **Property setter** (`owner.account = x`, `builder/...defineWriters`) and
  **mass-assignment** (`attribute-assignment.ts` has_one branch): QUEUE the
  change synchronously (the existing `replace` sets `_pendingReplace` and the
  in-memory FK via `setOwnerAttributes`), persisted on the owner's next
  `save()` (`flushPendingReplaces` → `persistReplace`). No DB I/O, no Promise
  returned from the setter, no floating promise.
- **Awaitable writer** `record.association(name).writer(value)`: persists
  immediately when awaited (Rails-faithful `HasOneAssociation#replace` —
  displaced record nullify/delete/destroy + save the new one), returning a
  `Promise`. No floating promise because the caller awaits.
- **Remove** the `_pendingWrite` machinery entirely (the field, the
  `builder/association.ts` capture + `.catch`, and the `flushPendingReplaces`
  `_pendingWrite` await).

## Salvage from PR #3722 (branch still in git)

- `sameRecord` helper mirroring `ActiveRecord::Core#==` (identity, then
  same-class/non-nil-same-id via `isEqual`) and its use at all three `replace`
  comparison sites + the `persistReplace` displaced-record guard. Keep.
- `writer` override returning the `persistReplace()` promise; keep as the
  awaitable immediate-persist path, but ensure **only awaited callers** reach
  it (sync setters/mass-assign must use a queue-only path instead).
- `persistReplace` early-clear of `_pendingReplace` (before first `await`) to
  avoid the double-call race. Keep.
- Most of the converted canonical tests in `has-one-associations.test.ts`.

## Acceptance criteria

- [ ] `has_one` property setter + mass-assignment queue until `save()`; no
      floating promise anywhere; `_pendingWrite` machinery removed.
- [ ] Awaitable `association(name).writer(value)` persists immediately
      (Rails `HasOneAssociation#replace` parity) and returns a Promise.
- [ ] `nullification on association change` / `association change calls delete`
      drive the **property setter + `await save()`** path (queue→flush) and
      assert the persisted effect.
- [ ] Pirate/Ship tests keep `assign; await save()` form (Rails
      `assert_queries_count(3/4)` already include the save).
- [ ] `has one transaction`'s bare-assignment 3-query assertion uses the
      awaitable `await writer(account2)` (the Rails-faithful immediate path);
      add a code comment noting the sync setter itself defers (JS cannot
      persist synchronously without a floating promise).
- [ ] No regression in the broader association suite; `api:compare` /
      `test:compare` deltas non-negative.

## Hard rules

- NO floating promises (the entire point).
- NO `node:*` imports; NO `process.*`; async fs only; no new runtime deps.
- 500 LOC ceiling; single PR from main; no stacked PRs.
- Test names match Rails verbatim.
