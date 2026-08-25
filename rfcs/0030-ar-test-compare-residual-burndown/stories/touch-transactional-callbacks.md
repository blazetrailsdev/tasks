---
title: "touch enrolls in transactional commit/rollback callbacks"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 18
pr: 3500
claim: "2026-06-16T21:00:42Z"
assignee: "touch-transactional-callbacks"
blocked-by: null
---

## Context

`touch` does not enroll a record in the transactional-callback machinery, so
`after_update_commit` / `after_rollback(on: :update)` never fire after a touch.
Root cause: `timestamp.touch` (packages/activerecord/src/timestamp.ts:21) builds
a direct UPDATE and runs only `after_touch` (line ~143) — it never goes through
`withTransactionReturningStatus` (as `save`/`destroy` do via
persistence.ts:540/568/703/741). Verified empirically: a record with
`afterUpdateCommit` touched inside a committed transaction yields an empty
history.

Rails routes `touch` through `with_transaction_returning_status` so it enrolls
and fires update commit/rollback callbacks (and belongs_to `touch: true` cascades
fire the parent's callbacks).

Blocks un-skipping these (transaction-callbacks.test.ts):

- only call after commit on update after transaction commits for existing record on touch (rails transaction_callbacks_test.rb:234)
- only call after commit on top level transactions (rails:241)
- only call after rollback on update after transaction rollsback for existing record on touch (rails:277)
- saving a record with a belongs to that specifies touching the parent should call callbacks on the parent object (rails:~)

## Acceptance criteria

- [ ] `touch` enrolls the record in the current transaction and fires
      `after_update_commit` / `after_rollback(on: :update)` on commit/rollback.
- [ ] belongs_to `touch: true` cascades fire the parent's transactional callbacks.
- [ ] The 4 tests above are un-skipped and pass; no new gate-mismatches.
