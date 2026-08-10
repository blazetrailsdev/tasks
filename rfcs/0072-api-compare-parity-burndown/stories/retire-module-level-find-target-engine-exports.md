---
title: "retire-module-level-find-target-engine-exports"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6236
claim: "2026-08-08T14:15:58Z"
assignee: "retire-module-level-find-target-engine-exports"
blocked-by: null
closed-reason: null
---

## Context

PR for `through-find-target-becomes-instance-method` /
`singular-find-target-becomes-instance-method` landed the Rails-shaped
instance methods:

- `SingularAssociation#findTarget`
  (`packages/activerecord/src/associations/singular-association.ts`, Rails
  `singular_association.rb:47`) — belongs_to and has_one now inherit it, and
  their `doAsyncFindTarget` overrides are gone.
- `HasManyThroughAssociation#findTarget` +
  `#targetReflectionHasAssociatedRecord`
  (`packages/activerecord/src/associations/has-many-through-association.ts`,
  Rails `has_many_through_association.rb:225` / `:121`).

What did NOT land is the second half of that story's acceptance: the
module-level `findTarget(record, assocName, options)` engine functions are
still exported from `singular-association.ts`, `has-many-association.ts`,
`has-many-through-association.ts` and `has-one-through-association.ts`, and
the instance methods delegate into them. They stay because ~10 callers hold
no association instance and pass arbitrary `(name, options)` pairs — some
for associations with no registered reflection, some (through loaders) with
a synthesised `scope` in the options:

- `associations.ts` — three through-loader call sites
- `associations/instance-methods.ts` — `record.loadBelongsTo(name)` sugar
- `associations/collection-proxy.ts:901`, `:1811`
- `delegate.ts:41,43`, `test-helpers/models/bulb.ts:39`
- `has-many-association.ts:584`, `singular-association.ts:463` (dynamic
  imports into the through engines)

Retiring the exports means materialising an `Association` for each of those
paths (an options-carrying holder for the reflection-less arm), which is the
substance of this story. Two callers cannot be served by
`record.association(name)` at all, and are the ones that set the shape:

- `has-many-through-association.ts:1146` —
  `findHasManyTarget(record, throughAssoc.name, augmentedOptions)`, where
  `augmentedOptions` carries a synthesised `scope` closure (the `sourceType`
  polymorphic filter) that exists in no registered reflection; when that
  through step is itself a through it recurses back into
  `has-many-association.ts:584` still carrying them.
- `has-many-through-association.ts:1175` — `findHasManyTarget(tr, ...)`, whose
  owner is a through record, not the association's owner.

So the synthetic `Association` must be constructed over an ad-hoc
`AssociationDefinition` AND must not collide with the owner's real cached
holder for that name — loadedness, `_loaderWritebackSuppressed` and inverse
wiring are all keyed on that holder. Budget for a behavioral change to the
association-cache contract, not a call-site rename.

## Acceptance criteria

- [ ] The module-level `findTarget` exports in the four association files are
      gone; every caller reaches the target load through an association
      instance method.
- [ ] `record.loadBelongsTo(name)` / `loadHasOne(name)` reader sugar keeps
      working unchanged.
- [ ] `pnpm parity:api && pnpm parity:api:extra --package activerecord --novel-only`
      show no new novel entries in `associations.ts` or the four association
      files.
- [ ] Association suites pass with no test renames.
