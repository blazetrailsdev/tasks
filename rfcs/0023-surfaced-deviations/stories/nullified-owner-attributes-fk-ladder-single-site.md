---
title: "Converge the two nullifiedOwnerAttributes FK ladders onto ownerForeignKeyColumns"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR 5636 converged owner-FK _column_ derivation onto `ownerForeignKeyColumns`
(`packages/activerecord/src/associations/foreign-association.ts`), used by the
collection, has_one, and engine paths.

Two `nullifiedOwnerAttributes` helpers were left out of that convergence and
still carry their own three-rung ladder for both the FK and the polymorphic
type column:

- `packages/activerecord/src/associations/has-one-association.ts` —
  `nullifiedOwnerAttributes(assoc)`: rung 1 `ctor._reflectOnAssociation(...)
?.foreignKey`, rung 2 `assoc.foreignKeyColumns()`, rung 3
  `opts.foreignKey ?? (opts.as ? ${as}_id : ${ctorName}_id)`; the type column
  repeats `refl?.foreignType ?? (as ? ${as}_type : null)`.
- `packages/activerecord/src/associations/has-many-association.ts` (~line 462)
  — a byte-for-byte copy of the same ladder.

Rails has no such ladder:
`ActiveRecord::Associations::ForeignAssociation#nullified_owner_attributes`
(`vendor/rails/activerecord/lib/active_record/associations/foreign_association.rb`)
is four lines reading `reflection.foreign_key` and `reflection.type` directly.
These are exactly the copies that drift — the has_one FK copy PR 5636 deleted had
drifted for as long as it existed.

## Acceptance criteria

- Both `nullifiedOwnerAttributes` free functions resolve the FK through
  `ownerForeignKeyColumns` and the type column through one shared helper; no
  per-call-site rungs remain.
- `ForeignAssociation.nullifiedOwnerAttributes` keeps its current signature and
  Rails-faithful body.
- `dependent: :nullify` coverage still passes (has-one, has-many,
  has-many-through, polymorphic nullify cases).
- No behavior change intended; no test renames.
