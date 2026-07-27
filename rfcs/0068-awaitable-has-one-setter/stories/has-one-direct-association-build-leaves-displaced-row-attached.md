---
title: "Direct association(name).build() on has_one leaves the displaced row attached"
status: in-progress
updated: 2026-07-27
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5442
claim: "2026-07-27T19:05:51Z"
assignee: "has-one-direct-association-build-leaves-displaced-row-attached"
blocked-by: null
closed-reason: null
---

## Context

PR #5290 retired `_displacedRecords` + the `autosaveHasOne` drain, moving
has_one displacement removal to the callers that can `await` it: the
`build#{Name}` / `create#{Name}` accessors (`detachDisplacedTarget`,
`packages/activerecord/src/associations/builder/has-one.ts:78-80,91-93`) and the
nested-attributes writer (`removeDisplacedRecord`,
`packages/activerecord/src/nested-attributes.ts`).

`SingularAssociation#build`
(`packages/activerecord/src/associations/singular-association.ts:30-40`) is a
third entry point that was previously covered by the deleted queue and is now
covered by nothing. `record.association("ship").build({...})` on a has_one with
a **loaded, persisted** target runs `setNewRecord`
(`has-one-association.ts`), which does only the in-memory nullify — so the
displaced row keeps its foreign key and stays attached in the DB.

Rails removes it inline: `set_new_record` -> `replace(record, false)` ->
`remove_target!`, including the persisted nullify `target.save`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:87-93,95-115`).

No test covers this path today (the full `associations/` + nested-attributes +
autosave run is green), which is why #5290 did not catch it.

## Acceptance criteria

- [ ] `record.association(name).build(attrs)` on a has_one with a loaded,
      persisted target removes the displaced record (FK nullified, or
      destroyed/deleted per `:dependent`), matching Rails' inline
      `remove_target!`.
- [ ] A regression test covers it and fails on the pre-fix baseline (verify by
      baselining, per CLAUDE.md).
- [ ] No re-introduction of a `_displacedRecords`-style queue drained at the
      owner's `save()` — that deferral is the deviation RFC 0068 is retiring.
      `removeDisplacedRecord` already exists as the target-preserving entry
      point; the open question is how a synchronous `build()` return reaches it.
