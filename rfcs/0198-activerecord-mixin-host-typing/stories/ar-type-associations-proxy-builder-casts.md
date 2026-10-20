---
title: "Type CollectionProxy finders, builder macro and include_in_memory receivers"
status: done
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9127
claim: "2026-10-20T13:30:28Z"
assignee: "ar-type-associations-proxy-builder-casts"
blocked-by: null
closed-reason: null
---

## Context

After trails#9116, 24 `as any|as unknown` casts remain in `packages/activerecord/src/associations/**` (non-test). These are not listed in `ar-type-associations-remaining-46-casts`, and each needs its receiver typed first:

- `collection-proxy.ts:290,303,309`: `FinderMethods.last` / `baseFindNthWithLimit` / `baseFindNthFromLast` `.call(this as any, …)`. `CollectionProxy` is not assignable to `FinderRelation`.
- `builder/association.ts:104`: `Reflection.create(macro as any, …)`. Builder `macro()` returns `string`, not `MacroType` (`reflection.ts:72`, unexported).
- `builder/association.ts:77`: `scope as any` passed to `createReflection`.
- `collection-association.ts:106`: `this.klass as any` in `idsWriter`. `associationPrimaryKey()` is `string | string[]`, and `typeForAttribute` takes `string` and can return null (Rails `collection_association.rb:73-80`).
- `collection-association.ts:435,437`: `include_in_memory?`'s `.reader` and source attribute read (Rails `collection_association.rb:503-511`).
- `has-many-through-association.ts:159`: `syncWrite` is `protected` on `HasOneAssociation`.

## Acceptance criteria

- [ ] Each cast above is dropped by typing its receiver, with no runtime change.
