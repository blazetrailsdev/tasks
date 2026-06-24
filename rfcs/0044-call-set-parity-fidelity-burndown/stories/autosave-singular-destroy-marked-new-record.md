---
title: "autosave-singular-destroy-marked-new-record"
status: ready
updated: 2026-06-24
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by the autosave-association-save-destroy-cluster audit (PR #4061)
while verifying against vendored Rails (`vendor/rails`).

Rails destroys a marked-for-destruction associated record
_unconditionally_ in the autosave save path -- it does NOT guard on
`new_record?`:

- `save_has_one_association`
  (`vendor/rails/activerecord/lib/active_record/autosave_association.rb:482-483`):
  `if autosave && record.marked_for_destruction? then record.destroy`.
- `save_belongs_to_association`
  (`autosave_association.rb:544-547`): nulls the owner FK, then
  `record.destroy`.

trails instead guards the destroy with `!isNewRecord()`:

- `packages/activerecord/src/autosave-association.ts` `autosaveHasOne`
  (line ~539-541): `if (isMarkedForDestruction(childRecord)) { if
(!childRecord.isNewRecord()) await childRecord.destroy(); }`.
- `_autosaveBelongsTo` (line ~764-772): nulls the FK, then
  `if (!assocRecord.isNewRecord()) await assocRecord.destroy();`.

Rails `Persistence#destroy` on a _new_ record still runs the destroy
callback chain (`run_callbacks(:destroy)`), `destroy_associations`
(dependent cascades), sets `@destroyed`, and freezes -- it only skips the
DB `DELETE` (`@_trigger_destroy_callback ||= persisted? && destroy_row > 0`,
persistence.rb). trails' `destroy()`
(`packages/activerecord/src/persistence.ts:788`) already does the same
(`deleteRow` emits SQL only when `isPersisted()`), so calling it on a new
record is safe and Rails-faithful. The `!isNewRecord()` guard therefore
silently skips before_destroy/after_destroy callbacks, dependent-destroy
cascades, and the freeze for a new marked-for-destruction child.

(The has_many / habtm collection variant of this destroy is tracked
separately under `autosave-collection-destroy-via-association-destroy`,
which converges them to `association.destroy(record)`; that path already
runs unconditionally per record, so this story is scoped to has_one and
belongs_to.)

## Acceptance criteria

- `autosaveHasOne` and `_autosaveBelongsTo` call the child `destroy()`
  unconditionally for a marked-for-destruction child (drop the
  `!isNewRecord()` guard), matching Rails autosave_association.rb:483 /
  547 -- so destroy callbacks, dependent cascades, and freeze fire on a
  new marked-for-destruction child.
- belongs_to still nulls the owner FK before destroying (Rails:545-547).
- A test exercising a new marked-for-destruction has_one / belongs_to
  child on owner save, with the test name matching the Rails
  `autosave_association_test.rb` test verbatim.
