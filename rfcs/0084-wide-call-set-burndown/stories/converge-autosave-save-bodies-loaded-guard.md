---
title: "Add Rails' association.loaded? guard and load_target read to the has_one and belongs_to save bodies"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6391
claim: "2026-08-12T00:46:03Z"
assignee: "naming-comparator-to-s-and-reserved-word-residue"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6385 (`converge-autosave-belongs-to-and-insert-helpers`) while
converging the `saveHasOneAssociation` locals.

Rails `save_has_one_association` opens with two lines
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:474-477`):

    association = association_instance_get(reflection.name)
    return unless association && association.loaded?

    record = association.load_target
    return unless record && !record.destroyed?

trails' `packages/activerecord/src/autosave-association.ts`:

- has no `association.loaded?` guard at all — it proceeds on an unloaded
  association and reads the raw `association.target`;
- reads `association.target` where Rails calls `association.load_target`;
- carries two trails-only pre-guards ahead of the Rails body: a
  `persistReplace` flush for has_one-through and a `_pendingReplace` sentinel
  early return, both documented at the call site as deferring Rails'
  assignment-time `create_through_record` to the owner save.

`save_belongs_to_association` has the same missing-`loaded?` shape: Rails'
`:533` is `return unless association && association.loaded? &&
!association.stale_target?`, and trails checks only `isStaleTarget`.

The `_pendingReplace` machinery is tracked separately (`0023-surfaced-deviations`
`converge-has-one-persist-onto-autosave-drop-pendingreplace`, done) — this story
is only the `loaded?` / `load_target` pair, which is what makes the guard
ordering legible next to the Ruby.

## Converged shape

Add `if (!association || !association.isLoaded()) return true;` to both
`saveHasOneAssociation` and `saveBelongsToAssociation` at Rails' position (the
belongs_to one conjoined with the existing `isStaleTarget` check, in Rails'
order), and read the target through `loadTarget()` rather than the `.target`
field.

Verify first whether the missing `loaded?` guard is currently load-bearing: the
callbacks are registered unconditionally, so an unloaded association reaching
this body is exactly what the guard is meant to cut off, and adding it may
change which records get persisted on owner save.

## Acceptance criteria

1. Both bodies carry Rails' `association && association.loaded?` guard at
   Rails' position, and read the target via `loadTarget()`.
2. `autosave-association.test.ts` (201), `.trails.test.ts` (9) and
   `src/associations/**` stay green — in particular the cold-cache has_one
   test in the trails file.
3. `pnpm parity:api:calls` / `:args` non-regressive; no new baseline rows.
