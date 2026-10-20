---
title: "Expose association reader/owner/target types; drop remaining associations/** casts"
status: in-progress
updated: 2026-10-19
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9106
claim: "2026-10-19T23:36:00Z"
assignee: "ar-type-association-readers-and-remaining-casts"
blocked-by: null
closed-reason: null
---

## Context

trails#9070 (ar-type-associations) brought the cast count in `packages/activerecord/src/associations/**` from 119 to 56. It did not meet that story's second criterion: "Association reader / owner / target types are exposed so a model file can read an association without a cast". That PR only removed casts and added no types.

These casts remain because the member is untyped:

- `collection-association.ts` `size()` casts `this` to call `countRecords()`. In Rails `count_records` is defined only on the subclasses (has_many_association.rb, has_many_through_association.rb), and CollectionAssociation#size calls it (vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_association.rb).
- `association.ts` `destroyAssociationAsyncJob` / `_afterCommitJobs` on owner/constructor.
- `collection-association.ts` looks up a callback through `this.owner.constructor[fullCallbackName]`, a computed name.
- `builder/has-and-belongs-to-many.ts` calls private builder members (`middleOptions`, `_tableName`, `belongsToOptions`) from module functions.
- `has-many-association.ts` indexes a record by column (`(assoc as any)[col]`).

## Acceptance criteria

- [ ] An association reader type (has_many → CollectionProxy<T>, belongs_to/has_one → T | null) and typed owner/target are exported so a model file reads an association without a cast.
- [ ] The listed casts are replaced by a declared abstract member or a narrow host type, with no runtime change.
- [ ] The `associations/**` count goes down from 56.
