---
title: "createThroughAssociation belongs_to source _type fallback should use polymorphic_name"
status: in-progress
updated: 2026-06-22
rfc: "0040-through-association-source-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 20
pr: 3863
claim: "2026-06-22T03:15:58Z"
assignee: "through-belongsto-source-type-uses-polymorphic-name"
blocked-by: null
---

## Context

`createThroughAssociation` in `packages/activerecord/src/associations.ts:2360`
writes the polymorphic source `_type` column for a belongs_to source as:

```ts
const typeValue = assocDef.options.sourceType ?? (target.constructor as typeof Base).name;
```

The fallback uses `(target.constructor).name` (the STI **subclass** name)
rather than `polymorphicName(target.constructor)` (`base_class.name`). For an
STI subclass target this stores e.g. `"SpecialPost"` where Rails'
`polymorphic_name` (`owner.class.polymorphic_name` semantics via
`record.class.polymorphic_name`) stores the base class name `"Post"`.

This is the same read/write asymmetry class fixed for the 6 direct-loader /
build / through sites in PR #3587 (story
`assoc-direct-loader-polymorphic-type-uses-polymorphic-name`), but on the
belongs_to-source branch of `createThroughAssociation`, which that story did
not scope in. The explicit `sourceType` option still takes precedence (correct
— Rails honors `:source_type` verbatim); only the inferred fallback needs to
route through `polymorphicName`.

Rails refs: `activerecord/lib/active_record/inheritance.rb:212`
(`polymorphic_name`), `belongs_to_polymorphic_association.rb:28`.

## Acceptance criteria

- [x] The `createThroughAssociation` belongs_to-source `_type` fallback uses
      `polymorphicName(target.constructor)` instead of `.name`.
- [x] Regression test: a has_one/has_many `:through` with a polymorphic
      belongs_to source whose target is an STI subclass stores `base_class.name`.
- [x] No api:compare / test:compare regression.
