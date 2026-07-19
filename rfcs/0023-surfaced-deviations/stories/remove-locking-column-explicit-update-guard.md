---
title: "Remove or converge the Rails-less locking-column explicit-update guard"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assertLockingColumnNotExplicitly` (packages/activerecord/src/persistence.ts:577)
raises a bare `Error("<lockCol> cannot be updated explicitly")` from `#update` /
`#update!`. It has **no Rails counterpart**: grepping
`vendor/rails/activerecord/lib/` and `test/` for "cannot be updated explicitly"
returns nothing, and `vendor/rails/activerecord/lib/active_record/locking/optimistic.rb`
has no such guard. Rails' `#update` does only `assign_attributes(attributes)`
before saving (`vendor/rails/activerecord/lib/active_record/persistence.rb:563-579`).

Introduced by #684 (`refactor(activerecord): extract update/updateBang/delete to
persistence.ts`) and never covered by a test — `grep "cannot be updated explicitly"`
across `packages/**/*.test.ts` returns nothing.

Surfaced in review of #4972, which moved the call to run on the sanitized hash
(it previously preempted `sanitize_for_mass_assignment`, and read own-enumerable
props off a raw params wrapper, so it silently missed `lock_version` on a real
`ActionController::Parameters`). #4972 fixed the ordering but deliberately left
the guard itself in place as out of scope.

Rails instead lets an explicit `lock_version` assignment through and handles the
locking column at save time (`optimistic.rb:96-119`).

## Acceptance criteria

- [ ] Determine whether Rails raises anywhere for an explicit locking-column
      update; if not, delete the guard and its call site in
      `assignUpdateAttributes`.
- [ ] If some Rails behavior IS being approximated, port it to the real Rails
      location (`locking/optimistic.rb`) with the Rails error class, not a bare
      `Error` in `persistence.ts`.
- [ ] Add coverage either way — the guard currently has none.
- [ ] `update(lock_version: N)` behavior matches Rails for a locking-enabled
      model (check `vendor/rails/activerecord/test/cases/locking_test.rb`).
