---
title: "activerecord: UniquenessValidator#validate_each guards and build_relation hand-roll what Rails sends to bind_attribute"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails PR 8412, which blocked `each-validator-validate-reads-through-an-invented-reader` on this file.

Rails' `ActiveRecord::Validations::UniquenessValidator#validate_each`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/validations/uniqueness.rb:20-51`) opens with
`finder_class = find_finder_class_for(record)` and `value = map_enum_attribute(finder_class, attribute, value)`.
`build_relation` (`uniqueness.rb:112-132`) is `klass.unscoped`, one `relation.bind_attribute(attribute, value)`
block inside `klass.with_connection`, and `relation.where!(comparison)`.

`packages/activerecord/src/validations/uniqueness.ts` carries arms Rails does not have:

- `validateEach` (`:70-77`) returns early on `value === undefined`, re-runs the `allowNil` / `allowBlank` skips
  `EachValidator#validate` already made (`activemodel/lib/active_model/validator.rb:153`), falls back to
  `record.constructor` when `findFinderClassFor` answers nothing, and returns when `finderClass.where` is absent.
- `readAttributeForValidation` (`:61-68`) overrides an `EachValidator` helper Rails does not have, to read the
  foreign key of an association. Rails reads the associated record and lets `bind_attribute`
  (`activerecord/lib/active_record/relation.rb`, ported at `packages/activerecord/src/relation.ts:1585`)
  swap in `reflection.foreign_key` and `value.read_attribute(reflection.join_primary_key)`.
- `buildRelation` (`:156` onward) re-implements that reflection swap by hand, with `foreignKey()[0]` and a
  `readAttribute` duck-type test, in place of calling `relation.bindAttribute`.

## Converged shape

`validateEach` opens as `uniqueness.rb:21-22` does. `buildRelation` calls `relation.bindAttribute(attribute, value, block)`
and keeps only the three comparison arms of `uniqueness.rb:118-127`. The `readAttributeForValidation` override goes
once `ar-read-attribute-for-validation-is-not-send` lets the validator receive the associated record; this story
depends on it for that one arm and can land the rest first.

## Acceptance criteria

- [ ] `validateEach` has no `value === undefined` return, no repeated `allowNil` / `allowBlank` skip, no
      `?? record.constructor` fallback and no `finderClass.where` guard.
- [ ] `buildRelation` reaches the reflection swap through `Relation#bindAttribute`, not a hand-rolled copy.
- [ ] `packages/activerecord/src/validations/uniqueness-validation.test.ts` stays green with unchanged test names;
      `pnpm parity:api:calls` and `pnpm parity:api:arms:report --package=activerecord` do not regress.
