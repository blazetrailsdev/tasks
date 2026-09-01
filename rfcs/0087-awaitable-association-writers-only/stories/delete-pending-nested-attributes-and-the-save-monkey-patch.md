---
title: "Delete _pendingNestedAttributes and the accepts_nested_attributes_for save monkey-patch"
status: claimed
updated: 2026-09-01
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: 2
pr: null
claim: "2026-09-01T18:59:00Z"
assignee: "delete-pending-nested-attributes-and-the-save-monkey-patch"
blocked-by: null
closed-reason: null
---

## Context

PR #7303 deleted one of the two deferral mechanisms in
`packages/activerecord/src/nested-attributes.ts` — `_pendingNestedReaderLoads`
(promises) and its `awaitPendingNestedReaderLoads` drain. The second one
survives and is the explicit follow-on the parent story named:

> Delete the `save` monkey-patch's `awaitPendingNestedReaderLoads` step. Whether
> `processNestedAttributes` and `_pendingNestedAttributes` can go the same way
> is the follow-on; file it rather than widening this story.

What remains (`nested-attributes.ts`):

- `assignNestedAttributes` stores attribute hashes in
  `record._pendingNestedAttributes` (a `Map`) instead of assigning them.
- `processNestedAttributes(record)` drains that map after a successful save.
- `acceptsNestedAttributesFor` reassigns `modelClass.prototype.save` behind a
  `_nestedSaveWrapped` flag to call the drain.

Rails has none of this. `accepts_nested_attributes_for`
(`activerecord/lib/active_record/nested_attributes.rb:344-384`) defines
`#{name}_attributes=` and sets `reflection.autosave = true`; the nested records
are then saved by the ordinary autosave callbacks
(`activerecord/lib/active_record/autosave_association.rb`), not by a wrapped
`save`. `assign_nested_attributes_for_*` assign **at assignment time**
(`nested_attributes.rb:434-450` one-to-one, `:452-491` collection), with no
staging map.

## Converged shape

- `assignNestedAttributes` assigns through
  `assignNestedAttributesFor{OneToOne,Collection}Association` at assignment
  time, as `nested_attributes.rb:428-432` dispatches.
- Delete `_pendingNestedAttributes`, `processNestedAttributes`,
  `storePendingNestedAttributes`, the `_nestedSaveWrapped` flag and the
  `modelClass.prototype.save` reassignment.
- Nested records persist via the autosave callbacks
  `defineAutosaveValidationCallbacks` already installs.

Note the ordering hazard recorded in the parent PR: nested assignment can owe a
read when the association is unloaded, and the sync surface raises since #7303.
Expect this story to depend on the same "no assignment owes I/O" endpoint as
[[update-must-call-assign-attributes-not-set-attributes]].

## Acceptance criteria

- [ ] `git grep _pendingNestedAttributes` and `git grep _nestedSaveWrapped`
      under `packages/` return nothing.
- [ ] `acceptsNestedAttributesFor` does not reassign `prototype.save`.
- [ ] Nested attributes persist through the ordinary autosave callbacks.
- [ ] `nested-attributes*.test.ts` (163 + trails cases) stay green on all three
      lanes.
