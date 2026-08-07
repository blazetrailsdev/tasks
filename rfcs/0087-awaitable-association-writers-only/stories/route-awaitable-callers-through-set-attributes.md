---
title: "Route update/create through setAttributes so a displacing nested write runs at assignment, not at save"
status: done
updated: 2026-08-07
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6204
claim: "2026-08-07T21:44:45Z"
assignee: "converge-fixture-teardown-delete-onto-a-live-connection"
blocked-by: null
closed-reason: null
---

## Context

Shipped by PR #6196 (`awaitable-mass-assignment-for-nested-attributes`) and
justified at the call site, but a deviation worth converging.

Rails runs a displacing `#{name}_attributes=` inline: `_assign_attributes`
(`activerecord/lib/active_record/attribute_assignment.rb:6-23`) is a plain
`each`, and the has_one writer's `load_target` / `remove_target!`
(`activerecord/lib/active_record/associations/has_one_association.rb:59-69`)
complete before the loop moves to the next key.

`packages/activerecord/src/persistence.ts` `assignAttributes` returns `void`
like Rails (`activemodel/lib/active_model/attribute_assignment.rb:28-35`), so it
cannot await that write. It parks it on the record (`parkNestedReaderLoad`,
`nested-attributes.ts:723`) and `save` drains it. Two consequences:

- The write does not run inline — it lands at `save`, not at assignment.
- Every step after a displacing key — later scalar keys, the nested pass, and
  `assign_multiparameter_attributes` (`attribute_assignment.rb:22`) — is
  assigned while that write is still in flight. Harmless today (all are
  in-memory attribute writes that never read association state), but it is not
  Rails' order.

`setAttributes` (same file) is the awaitable surface that does hold Rails'
order. The gap is that Rails' own entry points do not use it.

## Converged shape

Route every entry point that CAN await through `setAttributes`, shrinking the
parked path to the one caller the language forbids:

- `#update` / `#update!` (`vendor/rails/activerecord/lib/active_record/persistence.rb:563-580`)
  are already async in trails and call `assign_attributes` in Rails — they can
  `await this.setAttributes(attrs)`. Note they currently reach neither surface:
  `assignUpdateAttributes` (`persistence.ts:613`) is a fourth hand-rolled copy
  of the loop, which story
  `consolidate-three-assign-attributes-implementations`
  (0023-surfaced-deviations) covers — coordinate, do not duplicate.
- `create` / `createBang` construct then assign, so they can await too.
- `ActiveModel::API#initialize` (`activemodel/lib/active_model/api.rb:81`),
  reached from `Base#initialize`'s `super`
  (`activerecord/lib/active_record/core.rb:471-478`), is the genuine language
  limit: a JS constructor cannot await. Parking stays there and only there,
  which is what `_reapplyNestedAttrSetters` already does.

## Acceptance criteria

- [ ] `update` / `update!` / `create` / `createBang` await the assignment; a
      displacing nested key's write lands at assignment time, not at `save`.
- [ ] A guard pins that a key following a displacing key on those paths is
      assigned only after the write settles.
- [ ] `assignAttributes`' parking is documented as reachable only from the
      constructor, and its JSDoc's "uniform parking" paragraph is narrowed to
      match.
- [ ] The existing guards in `nested-attributes.trails.test.ts` — `finishes a
displacing nested assignment before assigning the next key` and `returns
nothing from assignAttributes and drains the displacing write on save` —
      both still hold.
- [ ] Green on sqlite, PG and MariaDB.
