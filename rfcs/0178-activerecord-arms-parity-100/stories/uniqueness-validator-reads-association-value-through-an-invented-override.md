---
title: "activerecord: UniquenessValidator reads an association value through an override Rails does not have"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: ["ar-read-attribute-for-validation-is-not-send"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8418, which converged `UniquenessValidator#build_relation` onto
`Relation#bind_attribute`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/validations/uniqueness.rb:112-132`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:102-111`).

`bind_attribute` reads the associated record's key
(`value.read_attribute(reflection.association_primary_key)`, `relation.rb:105`), so the validator
must be handed the record. Rails gets it for free: `read_attribute_for_validation` is `send`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:437`), and `send(:event)` loads
and returns the association.

trails' record-level `readAttributeForValidation` (`packages/activerecord/src/validations.ts`) does
not load an unloaded association, which is `ar-read-attribute-for-validation-is-not-send`. So
`packages/activerecord/src/validations/uniqueness.ts` keeps two pieces Rails does not have:

- a `protected override readAttributeForValidation` on `UniquenessValidator` that returns
  `record.association(attribute).reader` for an association attribute. `uniqueness.rb` defines no
  such method.
- `value = await value` as the first line of `validateEach`, because that reader answers a promise
  for an unloaded association. `validate_each` (`uniqueness.rb:20-23`) has no counterpart.

The override is `protected`, so the extra-surface report never counts it and a
`@noRailsEquivalent` receipt on it is reported STALE. This story is its only tracking.

## Acceptance criteria

- [ ] `UniquenessValidator` declares no `readAttributeForValidation`; the value reaches
      `validateEach` through the record's `read_attribute_for_validation`, as Rails' `send` does.
- [ ] `validateEach` does not await its `value` argument.
- [ ] `validates_uniqueness_of` on an association attribute still validates an UNLOADED association
      against its foreign key, not against `NULL`. "validate uniqueness on existing relation",
      "uniqueness on relation" and "uniqueness on custom relation primary key" in
      `packages/activerecord/src/validations/uniqueness-validation.test.ts` stay green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/validations/uniqueness-validation.test.ts
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord --direction=invented
```
