---
title: "converge-relation-family-slot-onto-autoload"
status: draft
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-activerecord-core-slots-onto-autoload`: `packages/activerecord/src/relation/uncacheable-methods-slot.ts`
holds `_relationFamilySlot` (the four Relation-family ctors), `_relationFamilyState.version` and `_registerRelationFamily`,
written by `relation.ts:1893`, `associations/collection-proxy.ts`, `association-relation.ts` and
`disable-joins-association-relation.ts`, and read by `relation/delegation.ts` (`delegatedClasses`, `uncacheableMethods`) and
`relation.ts` (`Relation#==`).

Rails names the four constants at call time:

- `relation/delegation.rb:7-15` — `delegated_classes` is `[ActiveRecord::Relation, ActiveRecord::Associations::CollectionProxy, ActiveRecord::AssociationRelation, ActiveRecord::DisableJoinsAssociationRelation]`.
- `relation/delegation.rb:17-21` — `uncacheable_methods` memoizes with `@uncacheable_methods ||=`; there is no version counter,
  because Rails eager-loads all four (`active_record.rb:95-112`) before the memo is read.

`ActiveRecord.AssociationRelation` and `Associations.CollectionProxy` are already autoloaded in
`packages/activerecord/src/namespaces.ts`.

## Acceptance criteria

- `ActiveRecord.Relation` and `ActiveRecord.DisableJoinsAssociationRelation` are autoloaded in `namespaces.ts` and seated
  by their defining modules; `delegatedClasses` / `Relation#==` read the four constants at call time, with no guard.
- The version counter goes, or is justified against the memo's first-read timing with a failing test that shows why.
- `uncacheable-methods-slot.ts` is deleted; plain-node dist entry imports of `relation.js`, `relation/delegation.js` and the
  three subclass modules do not throw TDZ.
