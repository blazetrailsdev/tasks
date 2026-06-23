---
title: "createThroughAssociation: write source _type verbatim from source_type, drop inferred polymorphicName fallback"
status: claimed
updated: 2026-06-23
rfc: "0040-through-association-source-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 5
pr: null
claim: "2026-06-23T17:32:57Z"
assignee: "through-create-source-type-verbatim-no-fallback"
blocked-by: null
---

## Context

`createThroughAssociation`'s belongs_to-source branch
(`packages/activerecord/src/associations.ts:2682-2687`) writes the polymorphic
source `_type` column as:

```ts
if (sourceAssocDef?.options?.polymorphic) {
  const typeCol = `${underscore(sourceName)}_type`;
  const typeValue =
    assocDef.options.sourceType ?? polymorphicName(target.constructor as typeof Base);
  through._writeAttribute(typeCol, typeValue);
}
```

This diverges from Rails. The through-create path mirrors
`ActiveRecord::Associations::ThroughAssociation#construct_join_attributes`
(`vendor/rails/.../through_association.rb:57`), which writes the foreign_type
**only when `options[:source_type]` is set**, and writes `options[:source_type]`
**verbatim** — there is no inference from the record's class:

```ruby
if options[:source_type]
  join_attributes[source_reflection.foreign_type] = [ options[:source_type] ]
end
```

Two deviations in the trails version:

1. The write is gated on `sourceAssocDef.options.polymorphic` rather than on
   `assocDef.options.sourceType` presence (Rails' actual gate).
2. The `?? polymorphicName(...)` fallback has **no Rails analog** in this path.
   The `polymorphic_name` write lives in
   `belongs_to_polymorphic_association#replace_keys` (the direct belongs*to=
   assignment path), not the through-create path. The fallback is also
   **unreachable in valid configs**: a polymorphic source without `source_type`
   is rejected by `ThroughReflection#checkValidityBang`
   (`HasManyThroughAssociationPolymorphicSourceError`, `reflection.ts:1763`).
   The validity check fires in `_cacheSingularTarget` (`associations.ts:2731`)
   only \_after* the `_type` write and transaction commit, so the fallback can
   only ever run for an invalid config that then throws.

PR #3863 (story through-belongsto-source-type-uses-polymorphic-name) corrected
the fallback `.name` -> `polymorphicName` for consistency with sibling sites
(2607/2717/3223), but the deeper convergence — gating on `source_type` and
dropping the inferred fallback entirely — was out of that story's scope.

## Acceptance criteria

- [ ] `createThroughAssociation` writes the source `_type` column gated on
      `assocDef.options.sourceType` being present (mirroring
      `if options[:source_type]` in `construct_join_attributes`), not on
      `sourceAssocDef.options.polymorphic`.
- [ ] The written value is `options[:source_type]` verbatim; remove the
      `?? polymorphicName(...)` inferred fallback (no Rails analog, unreachable
      in valid configs).
- [ ] The post-commit `rejects.toThrow()` regression test added in PR #3863
      (`has-one-through-associations.test.ts`) is updated/replaced to reflect
      the converged behavior (the through write should not occur — or the
      validity error should fire before any commit — under a polymorphic source
      with no `source_type`).
- [ ] No api:compare / test:compare regression.
