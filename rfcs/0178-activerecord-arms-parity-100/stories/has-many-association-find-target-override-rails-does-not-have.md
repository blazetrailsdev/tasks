---
title: "activerecord: HasManyAssociation#find_target is an override Rails does not have; collections load through Association#find_target"
status: in-progress
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#8741
claim: "2026-10-10T01:39:35Z"
assignee: "composite-primary-key-is-included-by-primary-key-setter-only"
blocked-by: null
closed-reason: null
---

## Context

trails#8731 made `Association#findTarget` (`packages/activerecord/src/associations/association.ts`)
the port of `vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:248-271`
and cut `SingularAssociation#findTarget` down to Rails' body. The collection side still bypasses it.

`HasManyAssociation#findTarget` (`packages/activerecord/src/associations/has-many-association.ts`)
overrides it with a module-level `findTarget(record, assocName, assocDef, violatesStrictLoading)`
loader and a `scope(record, assocName, assocDef)` helper. Rails' `has_many_association.rb` and
`collection_association.rb` define no `find_target`: a collection inherits `Association#find_target`,
and only `HasManyThroughAssociation#find_target`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb`)
overrides it, with `return [] unless target_reflection_has_associated_record?`,
`return scope.to_a if disable_joins` and `super`.

The hand-written loader returns the holder's target when it is already loaded, re-reflects the
association and raises `AssociationNotFoundError`, returns `[]` when an owner key is null, and loads
through `rel.load` with a `setInverseInstance` block in place of the statement cache.
`HasManyThroughAssociation#findTarget` also raises `NotImplementedError` for `async`, which Rails
does not.

## Acceptance criteria

- [ ] `HasManyAssociation` has no `findTarget` override and no module-level `findTarget` loader, so a
      collection loads through `Association#findTarget`.
- [ ] `HasManyThroughAssociation#findTarget` is Rails' three-line body and passes `async` to `super`.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:arms:throws` green;
      `associations/` tests green on all three adapters.
