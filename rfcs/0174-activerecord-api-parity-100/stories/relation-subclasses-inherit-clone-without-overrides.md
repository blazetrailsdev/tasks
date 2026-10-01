---
title: "activerecord: Relation subclasses inherit clone; no per-class override forwarding constructor arguments"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8343. Ruby's `Object#clone` copies every instance variable and then
dispatches `initialize_clone` / `initialize_copy`, so no `Relation` subclass in Rails defines
`clone`: `ActiveRecord::DisableJoinsAssociationRelation`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/disable_joins_association_relation.rb:4-38`)
and `ActiveRecord::AssociationRelation`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/association_relation.rb`) inherit it, and
`Relation#initialize_copy` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:95-98`)
is the only hook.

trails' `Relation#clone` (`packages/activerecord/src/relation.ts`) instead rebuilds through the
constructor — `new (relationClassFor.call(Relation, model))(model)` then `initializeCopy` — so a
subclass whose constructor takes more than the model has to override it to hand its own arguments
back:

- `DisableJoinsAssociationRelation#clone`
  (`packages/activerecord/src/disable-joins-association-relation.ts`) forwards `(klass, key, ids)`.
- `AssociationRelation#clone` (`packages/activerecord/src/association-relation.ts`) forwards
  `(klass, association)`.

Both carried `@noRailsEquivalent PERMANENT` with no CLAUDE.md section ratifying it. CLAUDE.md says
`obj.clone` ports as `rbObjClone(obj)` with `initializeClone` / `initializeCopy` at their Rails
names. The obstacle to try first: a relation built through a delegate class is a
constructor-returned Proxy (`Relation`'s constructor, `isModuleIncluded(new.target,
ClassSpecificRelation)`), so a plain ivar copy loses the trap.

## Converged shape

`Relation#clone` copies the receiver's own fields the way `rb_obj_clone` copies ivars (through
`rbObjClone`, or an equivalent that re-wraps the Proxy) and dispatches `initializeCopy`. Neither
subclass defines `clone`.

## Acceptance criteria

- [ ] No `clone` override on `DisableJoinsAssociationRelation` or `AssociationRelation`; a cloned
      instance keeps its class, its constructor-supplied fields and its Proxy behaviour.
- [ ] `Relation#clone` goes through `rbObjClone` or carries a receipt against a CLAUDE.md section
      naming the language shortcoming.
- [ ] `pnpm parity:api:extra:gate` stays green.
