---
title: "Relation#new/create, Base.create, assignAttributes and association build reject a permitted Parameters at compile time"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
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

trails#8308 widened `Base.new` / `build` / `update` / `updateBang` and the `Base` constructor to
accept `PermittedAttributes` (activemodel `forbidden-attributes-protection.ts`), so a permitted
`ActionController::Parameters` type-checks there. The rest of the mass-assignment surface still
takes `Record<string, unknown>` only, so the same value is a compile error at:

- `Relation#new` / `build` / `create` / `createBang` (`packages/activerecord/src/relation.ts`
  `build` overloads near `:491`, `new` near `:1274`, `create` near `:511`) and the
  `_new` / `_create` / `_createBang` hooks, including `AssociationRelation#_new`
  (`association-relation.ts:39`).
- `Base.create` / `createBang` (`base.ts`) and `assignAttributes` / `setAttributes`
  (`base.ts` instance declarations).
- `CollectionAssociation#build` / `create` (`associations/collection-association.ts:185`) and the
  collection proxy.

Rails takes any object that responds to `permitted?` at all of them: each funnels into
`ActiveModel::AttributeAssignment#assign_attributes`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb:28-37`), which calls
`sanitize_for_mass_assignment` (`forbidden_attributes_protection.rb`). At runtime trails already
accepts it (`Relation#_new` calls the constructor, which sanitizes); only the types reject it, so
`Post.where(x).new(this.postParams())` in a controller needs a cast.

## Acceptance criteria

- [ ] Every entry point above accepts `Record<string, unknown> | PermittedAttributes` in its
      single-record overload, with the base declaration and its mixin implementation spelled
      identically (mixin-declaration-drift).
- [ ] A test passes a permitted and an unpermitted `ProtectedParams`
      (`support/stubs/strong-parameters.ts`) through `Relation#new`, `Relation#create` and a
      collection association `build`, with no cast: assigned, and `ForbiddenAttributesError`.
