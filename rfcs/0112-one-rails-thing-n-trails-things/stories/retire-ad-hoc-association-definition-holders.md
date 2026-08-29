---
title: "retire-ad-hoc-association-definition-holders"
status: ready
updated: 2026-08-29
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

# Retire the ad-hoc `AssociationDefinition` holders

## Context

PR-in-flight for `retire-associations-array-for-reflection-registry` deleted
`model._associations` and made `Reflection.addReflection` the only registry:
`Builder::Association.createReflection`
(`packages/activerecord/src/associations/builder/association.ts`) now ends at
`Reflection.create(macro, name, scope, options, model)` exactly as Rails does
(`associations/builder/association.rb:48-49`), and every read site resolves
through `_reflectOnAssociation` / `reflectOnAllAssociations`.

What that PR did NOT finish is the third acceptance criterion of that story —
"no reader is duplicated between `AssociationDefinition` and the reflection
classes". `AssociationDefinition` (`packages/activerecord/src/associations.ts`)
still declares `macro`, `extensions`, `scopeFor`, `foreignKey`,
`associationPrimaryKey`, `counterCacheColumn`, `hasCachedCounter`,
`hasActiveCachedCounter`, `isCounterMustBeUpdatedByHasMany`, `inverseName`,
`isInverseUpdatesCounterCache`, `klass` and `foreignType`, each documented
against the Rails reader it stands in for.

It survives because two paths still build ad-hoc holders with no registered
reflection:

- `findCollectionTarget` (`packages/activerecord/src/test-helpers/`), and
- `loadHasManyThrough`'s synthesised `sourceType` scope
  (`packages/activerecord/src/associations/has-many-through-association.ts`),
  plus the `_buildAssociationInstance` callers in
  `has-many-association.ts` and `has-one-through-association.ts` that pass a
  literal `{ name, type, options }`.

`_richReflectionFor` (`associations/association.ts`) exists only to back those
holders with the registered reflection, and carries a
`@noRailsEquivalent CONVERGEABLE` receipt saying it "retires with the last
holder that is not built from a reflection".

## Acceptance criteria

- [ ] Every `_buildAssociationInstance` caller passes a reflection, not a
      literal `{ name, type, options }` holder.
- [ ] `_richReflectionFor` and its `@noRailsEquivalent` receipt are gone.
- [ ] `AssociationDefinition` no longer declares a reader that an
      `AssociationReflection` / `ThroughReflection` already answers; ideally the
      interface is gone and `Association#reflection` is typed as the reflection.
- [ ] `pnpm parity:api` / `parity:api:extra` deltas non-negative.
