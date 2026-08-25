---
title: "Inline Array(reflection.foreign_key) + zip in saveHasOneAssociation, drop the bespoke CPK scaffolding"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6391
claim: "2026-08-12T00:46:03Z"
assignee: "naming-comparator-to-s-and-reserved-word-residue"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6385 (`converge-autosave-belongs-to-and-insert-helpers`), which
inlined `Array(reflection.foreign_key)` at the two `save_belongs_to_association`
call sites. The has_one sibling was left alone and is the last holder of the
bespoke FK/PK pairing block.

Rails `save_has_one_association`
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:489-497`)
is five lines:

    unless reflection.through_reflection
      foreign_key = Array(reflection.foreign_key)
      primary_key_foreign_key_pairs = primary_key.zip(foreign_key)
      primary_key_foreign_key_pairs.each do |primary_key, foreign_key|
        association_id = _read_attribute(primary_key)
        record[foreign_key] = association_id unless record[foreign_key] == association_id
      end
      association.set_inverse_instance(record)
    end

`primary_key` is already computed above at `:485` as
`Array(compute_primary_key(reflection, self)).map(&:to_s)` — the same value the
trails body binds as `pkArr` for the `_record_changed?` check, then throws away.

trails' `packages/activerecord/src/autosave-association.ts`
`saveHasOneAssociation` instead re-derives both sides inside the branch: a
three-way `reflection.foreignKey ?? assoc.options.foreignKey ?? underscore(...)`
fallback chain, an `explicitPk` special case, a "computePrimaryKey may collapse
a CPK to id" corrective re-read of `ctor.primaryKey`, a hand-rolled
`composite_primary_key?` collapse, and then a three-armed
array/scalar/mismatch dispatch that raises `CompositePrimaryKeyMismatchError`
via `routeThroughCheckValidity`. Rails has none of it: `zip` pads and truncates,
so a shape mismatch silently writes fewer columns rather than raising.

The synthetic `assoc: AssociationDefinition` local the body builds from
`reflection` (name/type/options) exists only to feed that block and the
`autosave` read; Rails reads `reflection.options[:autosave]` directly.

## Converged shape

In `saveHasOneAssociation`, reuse the `primary_key` already computed for the
`_record_changed?` gate, add `const foreignKey = Array(reflection.foreignKey)`,
and zip the two with Ruby `Array#zip` semantics (which
`saveBelongsToAssociation` already does at the sibling site). Delete the
`explicitPk` / CPK-collapse / mismatch-raise scaffolding and the synthetic
`assoc` local, reading `reflection.options` directly.

Note the CPK collapse and the QC branch both already live in
`computePrimaryKey` (the port of `compute_primary_key`,
`autosave_association.rb:576-587`) — the in-branch copies are duplicates of it,
which is why they can go rather than move.

## Acceptance criteria

1. `saveHasOneAssociation`'s FK write is `Array(reflection.foreignKey)` zipped
   against the already-computed primary key, in Rails' shape; the bespoke
   fallback chain, CPK collapse, and `CompositePrimaryKeyMismatchError` raise
   are gone from this body.
2. The synthetic `assoc` local is gone; `reflection.options` is read directly.
3. `autosave-association.test.ts` (201), `.trails.test.ts` (9), and
   `src/associations/**` stay green, including the composite-PK has_one cases.
4. `pnpm parity:api:calls` / `:args` non-regressive; no new baseline rows.
