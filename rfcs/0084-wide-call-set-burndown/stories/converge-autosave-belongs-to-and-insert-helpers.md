---
title: "Inline the three remaining trails-only autosave helpers at Rails' call sites"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6385
claim: "2026-08-11T23:26:01Z"
assignee: "converge-autosave-belongs-to-and-insert-helpers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while folding the autosave save helpers into their Rails-named methods
(PR #6382, story `converge-autosave-association-instance-get`). That PR removed
`_loadedAssociation`, `autosaveHasMany`, `autosaveHasOne`, `_autosaveBelongsTo`
and `_resolveBelongsToPrimaryKey`; three trails-only helpers Rails does not have
survive in `packages/activerecord/src/autosave-association.ts`, each with a
single caller.

- `_resolveBelongsToForeignKey` — Rails writes `foreign_key =
Array(reflection.foreign_key)` inline, twice, in `save_belongs_to_association`
  (`vendor/rails/activerecord/lib/active_record/autosave_association.rb:545,562`).
  trails' helper re-derives the FK from `assoc.options.foreignKey` /
  `queryConstraints` / a defaulted `${underscore(name)}_id` before falling back
  to `reflection.foreignKey`. The deferral exists because
  `reflection.foreignKey`'s getter can raise from `deriveFkQueryConstraints`
  (reflection.ts) on an unloaded association — so converging this one likely
  means fixing that getter, not just inlining the helper.
- `_insertCollectionRecord` / `_insertCollectionRecordFallback` — Rails'
  `save_collection_association` (`autosave_association.rb:442-457`) inlines the
  whole insert-vs-update dispatch: `association.set_inverse_instance(record)`
  then `association.insert_record(record, false)` under `autosave`, `elsif
!reflection.nested?` for the plain arm, `elsif autosave` for
  `record.save(validate: false)`. There is no fallback path in Rails at all —
  `_insertCollectionRecordFallback` re-implements FK pairing for the case where
  the association instance has no `insertRecord`, which Rails cannot reach.

## Converged shape

Inline `_resolveBelongsToForeignKey` as `Array(reflection.foreign_key)` at both
Rails call sites (gated on the reflection getter no longer raising); inline
`_insertCollectionRecord`'s dispatch into `saveCollectionAssociation`'s record
loop in Rails' branch order, and delete `_insertCollectionRecordFallback` once
it is shown unreachable (or file the reachability as its own blocker).

## Acceptance criteria

1. The three helpers are gone, their logic inlined at Rails' call sites in
   Rails' branch order.
2. `autosave-association.test.ts`, `nested-attributes*`, and
   `src/associations/**` stay green.
3. `pnpm parity:api:calls` / `:args` non-regressive; no new baseline rows.
