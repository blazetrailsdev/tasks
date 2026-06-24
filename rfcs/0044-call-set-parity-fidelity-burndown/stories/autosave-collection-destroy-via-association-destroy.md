---
title: "autosave-collection-destroy-via-association-destroy"
status: claimed
updated: 2026-06-24
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-24T16:42:27Z"
assignee: "autosave-collection-destroy-via-association-destroy"
blocked-by: null
---

## Context

The autosave collection destroy path destroys marked-for-destruction
persisted children via record-level `child.destroy()`:

- `packages/activerecord/src/autosave-association.ts` `autosaveHasMany`
  (line ~397) and `autosaveHabtm` (line ~850).

Rails' `save_collection_association`
(`activerecord/lib/active_record/autosave_association.rb:431-434`)
instead routes each marked record through `association.destroy(record)`,
which additionally:

- fires the collection `before_remove` / `after_remove` callbacks, and
- removes the record from the in-memory collection target.

trails already has the association-level path
(`packages/activerecord/src/associations/collection-association.ts:302`
`destroy(...records)` -> `deleteOrDestroy(records, "destroy")` ->
`removeRecords`), so the DB destroy IS currently reached (autosave
persistence is not dropped), but the autosave loop bypasses the
collection-removal semantics. This was surfaced in the
autosave-association-save-destroy-cluster audit (PR #4061) and recorded
as a tracked-pending-convergence baseline entry in
`scripts/api-compare/call-mismatches-exclude.json`
(`autosave-association.ts` / `save_collection_association` / `destroy`).

Naive convergence (`inst.destroy(child)` inside the loop) would mutate
`inst.target` mid-iteration, so the loop must snapshot the children
first.

## Acceptance criteria

- `autosaveHasMany` / `autosaveHabtm` route marked-for-destruction
  persisted children through the association-level destroy
  (`CollectionAssociation#destroy`) so `before_remove`/`after_remove`
  fire and the record is removed from the in-memory target, matching
  Rails `save_collection_association` (autosave_association.rb:431-434).
- Iteration is snapshotted so mutating `inst.target` during destroy does
  not skip or double-process children.
- A test exercising autosave collection destroy, with the test name
  matching the Rails `autosave_association_test.rb` test verbatim.
- Once converged, the `save_collection_association` / `destroy` row is
  removed from `call-mismatches-exclude.json` (the only-shrink ratchet
  forces it out once the call lands).
