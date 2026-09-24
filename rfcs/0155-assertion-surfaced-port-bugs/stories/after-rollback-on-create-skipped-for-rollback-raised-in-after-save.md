---
title: "after-rollback-on-create-skipped-for-rollback-raised-in-after-save"
status: claimed
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-09-24T17:44:04Z"
assignee: "activesupport-time-with-zone-subnanosecond-fractions"
blocked-by: null
closed-reason: null
---

## Context

`has_many_associations_test.rb:3154` (`test_create_children_could_be_rolled_back_by_after_save`) creates a `Client` whose `after_save` raises `ActiveRecord::Rollback` (`test/models/company.rb:168-176`), and asserts the `after_rollback(on: :create)` callback set `rollback_on_create_called`.

In trails the record comes back with `rollbackOnCreateCalled === false` and `isPersisted() === true`. That happens both through `firm.clients.create(...)` and through a plain `Client.create({ name }, (c) => { c.rollbackOnSave = true })`. So the bug is in the save transaction wrapper (`Transactions#with_transaction_returning_status` / `rolledback!`, `activerecord/lib/active_record/transactions.rb`), not in the association.

The test is parked as `it.skip` with a `BLOCKED:` line in `packages/activerecord/src/associations/has-many-associations.test.ts`.

## Acceptance criteria

- A `Rollback` raised from `after_save` inside a create rolls the record back (`new_record?` restored) and fires `after_rollback(on: :create)`, as in Rails.
- Un-skip `create children could be rolled back by after save` in `has-many-associations.test.ts`; it passes on every adapter.
