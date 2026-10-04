---
title: "activemodel: EachValidator#validate sends read_attribute_for_validation instead of an invented fallback reader"
status: blocked
updated: 2026-10-02
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activemodel"]
deps:
  - ar-read-attribute-for-validation-is-not-send
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-02T18:02:01Z"
assignee: "arel-mixin-hosts-take-the-arel-node-union"
blocked-by: "Blocked on ar-read-attribute-for-validation-is-not-send. Deleting EachValidator's protected readAttributeForValidation (validator.ts:82-93) removes the hook ActiveRecord's UniquenessValidator overrides (activerecord/src/validations/uniqueness.ts:61-68) to read the foreign key of an UNLOADED association. Rails needs no such hook: read_attribute_for_validation is alias send (activemodel/lib/active_model/validations.rb:437), so validator.rb:152 loads the association and bind_attribute (relation.rb) reads its join primary key. trails' AR reader cannot send an async association reader, so with the helper deleted the unloaded value is undefined and three uniqueness-validation.test.ts tests go red: 'validate uniqueness with object arg', 'validate uniqueness on existing relation', 'uniqueness on custom relation primary key'. Moving the FK read into validateEach is not behaviour-preserving (validate's allow_nil skip runs first) and only relocates the deviation."
closed-reason: null
---

## Context

`ActiveModel::EachValidator#validate` reads the value with
`record.read_attribute_for_validation(attribute)`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validator.rb:152`), a plain send on the record.

The port (`packages/activemodel/src/validator.ts:47`) calls a `protected readAttributeForValidation`
of its own (`validator.ts:82-93`), which Rails does not have. It tries
`record.readAttributeForValidation`, then `record._readAttribute`, then a bare `record[attribute]`
property read. The second and third arms let a record with no `read_attribute_for_validation`
validate, where Rails raises `NoMethodError`.

Seen while converging the arms of `EachValidator#validate` in trails PR 8386. Related:
`ar-read-attribute-for-validation-is-not-send`.

## Acceptance criteria

- [ ] `EachValidator#validate` calls `record.readAttributeForValidation(attribute)` directly, as
      `validator.rb:152` does; the `protected readAttributeForValidation` helper is deleted.
- [ ] Test doubles that relied on the `_readAttribute` / bare-property fallbacks define
      `readAttributeForValidation` (or include `Validations`).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra --package activemodel` stay green.
