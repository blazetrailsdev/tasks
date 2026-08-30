---
title: "reflection-type-read-as-macro"
status: draft
updated: 2026-08-30
rfc: "0112-one-rails-thing-n-trails-things"
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

# `nested_attributes` / `autosave_association` read `reflection.type` as a macro

## Context

Rails' `AssociationReflection#type` is the **polymorphic type column name** —
`reflection.rb` builds it from `options[:as]` (`"imageable_type"`), and it is
`nil` for a non-polymorphic association. It is never a macro string.

trails' retired `AssociationDefinition` holder declared a `type` field carrying
the macro (`"belongsTo" | "hasOne" | "hasMany" | "hasAndBelongsToMany"`), and
several call sites still read `.type` expecting that meaning off reflections
that come from `_reflectOnAssociation`:

- `packages/activerecord/src/nested-attributes.ts:133`
  `const isCollectionLike = assocDef.type !== "belongsTo";` — a real
  reflection's `type` is `null` or a column name, so this is **always true**,
  including for a `belongsTo`.
- `packages/activerecord/src/nested-attributes.ts:145` — `assocDef.type === "belongsTo"`
  picking the foreign-key spelling, so a `belongsTo` gets the
  `${underscore(ctor.name)}_id` arm instead of `${underscore(assocName)}_id`.
- `packages/activerecord/src/nested-attributes.ts:185` — `assocDef.type === "belongsTo"`
  choosing the create path.
- `packages/activerecord/src/nested-attributes.ts:695` —
  `assocDef.type === "hasAndBelongsToMany"` in `stubOwnerForeignKey`.
- `packages/activerecord/src/autosave-association.ts:662-667` —
  `reflection.type === "hasMany" | "hasAndBelongsToMany" | "hasOne"` as
  OR-arms after the correct `reflection.macro === ...` checks; dead rather
  than wrong, but the same misreading.

The holders these once read are gone (PR #7227 retired
`AssociationDefinition` in favour of `AssociationReflection | ThroughReflection`),
so every one of these now reads the Rails-meaning `type` off a real reflection.
The reflections are `any`-typed at these call sites, so `tsc` says nothing.

Surfaced during review of PR #7227.

## Acceptance criteria

- [ ] Every `.type` read that means "which macro is this" becomes `.macro`
      (or the `isBelongsTo()` / `isHasMany()` predicate Rails offers), across
      `nested-attributes.ts` and `autosave-association.ts`.
- [ ] The dead OR-arms in `autosave-association.ts:662-667` are removed rather
      than translated — `reflection.macro` already answers them.
- [ ] A regression test covers the `nested-attributes.ts:133` arm for a
      `belongsTo` nested attribute, and fails on the current baseline.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
