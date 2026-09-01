---
title: "processNestedAttributes is a second, deferred nested-attributes path Rails does not have"
status: draft
updated: 2026-09-01
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `processNestedAttributes` is a second, deferred nested-attributes path Rails does not have

## Context

Rails has exactly one nested-attributes assignment path. `accepts_nested_attributes_for`
(`activerecord/lib/active_record/nested_attributes.rb:493-518`) generates
`#{name}_attributes=`, which calls `assign_nested_attributes_for_one_to_one_association`
or `assign_nested_attributes_for_collection_association`
(`nested_attributes.rb:527-560` / `:596-660`). Those build or update the associated
records in memory; **autosave** persists them on `save`. There is no second path and
no post-save hook.

trails has two:

- `assignNestedAttributesForOneToOneAssociation` / `...ForCollectionAssociation`
  (`packages/activerecord/src/nested-attributes.ts:468` / `:551`), the ports of the
  two Rails methods, reached through the generated `set<Name>Attributes` writer
  (`generateAssociationWriter`, `nested-attributes.ts:349-365`).
- `assignNestedAttributes` (`nested-attributes.ts:78`) → parks the hashes on
  `record._pendingNestedAttributes`, and `acceptsNestedAttributesFor` wraps
  `modelClass.prototype.save` (`nested-attributes.ts:61-75`) so
  `processNestedAttributes` (`nested-attributes.ts:109-222`) drains them
  **after** the owner is saved, issuing its own `create` / `update` / `destroy`
  and hand-rolling an Arel `UpdateManager` to write the belongs_to foreign key
  back onto the owner (`nested-attributes.ts:196-210`).

Neither the parked map, the `save` wrapper, nor the write-back UPDATE exists in
Rails. The second path is also barely exercised — `assignNestedAttributes` is
called only from `autosave-association.test.ts` and
`autosave-association.trails.test.ts`, always with a collection — which is why
its `belongsTo` branch sat dead behind a `reflection.type === "belongsTo"`
misread until PR #7337 fixed the macro read and added the first test to cover it.

## Converged shape

One path. `assignNestedAttributes` becomes a thin caller of the two ported Rails
methods (or is deleted in favour of the generated writer), the
`_pendingNestedAttributes` map and the `save` wrapper come out, and persistence
of the built records goes back through autosave — where
`save_belongs_to_association` (`activerecord/lib/active_record/autosave_association.rb:475-492`)
already sets the owner's foreign key with `self[reflection.foreign_key] = ...`,
so the bespoke `UpdateManager` write-back is unnecessary.

## Acceptance criteria

- [ ] `processNestedAttributes`, `_pendingNestedAttributes` and the
      `modelClass.prototype.save` wrapper in `acceptsNestedAttributesFor` are gone.
- [ ] `assignNestedAttributes` routes to
      `assignNestedAttributesForOneToOneAssociation` /
      `assignNestedAttributesForCollectionAssociation`, or is removed.
- [ ] The belongs_to foreign key is written by autosave, not a bespoke
      `UpdateManager` UPDATE.
- [ ] The `Bird` belongs_to nested-attributes test added by PR #7337
      (`nested-attributes.trails.test.ts`, "assigns the owner's foreign key when a
      belongs_to nested attribute creates the target") still passes, as do
      `nested-attributes.test.ts` and `autosave-association.test.ts`.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
