---
title: "update-attribute-uses-public-send-setter"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

`update_attribute` / `update_attribute!` must assign through the public setter,
not `writeAttribute`. Rails: `vendor/rails/activerecord/lib/active_record/persistence.rb:530-536`
(`public_send("#{name}=", value)`, then `save(validate: false)`) and `:552-557` for the bang form.

trails: `packages/activerecord/src/persistence.ts` `updateAttribute` (~:564) and
`updateAttributeBang` (~:575) call `this.writeAttribute(name, value)`. So
`update_attribute(:change_approved_before_save, true)` (a non-column
`attr_accessor` on Topic) raises `MissingAttributeError: can't write unknown attribute`.

The converged Rails tests are parked `it.skip` in
`packages/activerecord/src/persistence.test.ts`: "update attribute" and
"update attribute!" (Rails `persistence_test.rb` `test_update_attribute` / `test_update_attribute!`).

## Acceptance criteria

- `updateAttribute` / `updateAttributeBang` assign via the `name=` setter, as Rails does.
- Un-skip "update attribute" and "update attribute!" in `persistence.test.ts`; both pass unchanged.
- Topic's `changeApprovedBeforeSave` accessor (already in `test-helpers/models/topic.ts`) is reached by `updateAttribute`.
