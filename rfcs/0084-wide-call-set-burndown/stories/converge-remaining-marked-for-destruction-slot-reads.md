---
title: "Converge the remaining marked_for_destruction? slot reads to the ported method"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6415
claim: "2026-08-12T14:36:51Z"
assignee: "converge-remaining-marked-for-destruction-slot-reads"
blocked-by: null
closed-reason: null
---

## Context

PR #6403 (`changed_for_autosave?`) and PR #6411 (`association_valid?`) each converged
one call site from the private slot read
`isMarkedForDestruction(record)` — `record[Symbol.for("blazetrails.markedForDestruction")]` —
to the ported method `record.markedForDestruction()`. The remaining slot
readers in the same file were out of scope for both and still bypass the method,
so a subclass or nested-attributes host overriding `marked_for_destruction?`
is ignored on those paths.

Remaining call sites in `packages/activerecord/src/autosave-association.ts`
(line numbers as of 7061b019e):

- `:170` `isDestroyable` — Rails
  `activerecord/lib/active_record/autosave_association.rb:341`:
  `record.destroyed? || record.marked_for_destruction?` reached through
  `Persistence#destroyed?` / the method.
- `:240` the `recordsToDestroy` filter inside the collection save —
  `autosave_association.rb:436` `records.select(&:marked_for_destruction?)`
  (a symbol-to-proc over the METHOD).
- `:357` and `:473` the has_one / belongs_to autosave arms —
  `autosave_association.rb:456` and `:497`,
  `autosave && record.marked_for_destruction?`.

`packages/activerecord/src/nested-attributes.ts:39` also wraps the slot read;
Rails' `_destroy` is `marked_for_destruction?`
(`activerecord/lib/active_record/nested_attributes.rb:597`).

## Converged shape

Every one of those terms calls `record.markedForDestruction()`, exactly as
Rails calls `record.marked_for_destruction?`. The standalone
`isMarkedForDestruction` export survives only if a caller genuinely has no
`Base` in hand; otherwise delete it (it is also re-exported from
`packages/activerecord/src/index.ts:337`, so removing it is public surface
that `parity:api:extra` currently scores).

## Acceptance criteria

- Each listed site dispatches through `record.markedForDestruction()`.
- `isMarkedForDestruction` is deleted, or each surviving caller is justified at
  the call site with a Rails cite.
- Regression coverage that fails on the pre-fix body for at least the collection
  (`:240`) and has_one (`:357`) arms — a subclass overriding
  `markedForDestruction()` must be honoured.
- autosave-association, nested-attributes and has-one suites green on all three
  adapter lanes.
