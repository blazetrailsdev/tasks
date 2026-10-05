---
title: "activemodel: Attribute holds @value / @value_before_type_cast under other ivar names, plus an invented @_has_value"
status: in-progress
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8531
claim: "2026-10-05T14:09:37Z"
assignee: "attribute-value-ivars-are-not-rails-ivar-names"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8525 while dumping a model through ruby-compat's `Marshal`. `Attribute`
(`packages/activemodel/src/attribute.ts:31-36`) holds Rails' `@value_before_type_cast` and `@value`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb:33-39,43-48`) in the
`_valueBeforeTypeCast` and `_value` fields with no `rbDeclareIvar`, and carries a `_hasValue` field
standing in for `defined?(@value)`. So `rbObjInstanceVariables(attribute)` answers
`@_value_before_type_cast`, `@_value` and `@_has_value`, and `Marshal.dump` of a `FromDatabase` /
`FromUser` / `WithCastValue` writes those three names where MRI writes `@value_before_type_cast` and,
once read, `@value`. Only `@value_for_database` is declared (`attribute.ts:267`).

An attribute Marshal allocates and loads through `UserProvidedDefault#marshalLoad` with four values
(`packages/activemodel/src/attribute/user-provided-default.ts`) has no `_hasValue` own field, where a
constructed one holds `false`; the two differ under `rbObjInstanceVariables`.

## Acceptance criteria

- [ ] `rbObjInstanceVariables` of an `Attribute` answers Rails' names: `@name`,
      `@value_before_type_cast`, `@type`, `@original_attribute`, and `@value` only once the value has
      been read (`attribute.rb:43-48`).
- [ ] No `@_has_value` ivar: `defined?(@value)` is read off the `@value` seat itself (an own-property
      test), in `value`, `has_been_read?` (`attribute.rb:139-141`), `initialize_dup` (`:155-159`),
      `encode_with` / `init_with` (`:161-173`) and `UserProvidedDefault#marshal_dump` /
      `marshal_load` (`attribute/user_provided_default.rb:29-49`).
- [ ] `Marshal.dump(Attribute.from_user(...))` writes Rails' ivar names; a trails test pins them.

## Verification

```bash
pnpm vitest run packages/activemodel/src/attribute.test.ts packages/activemodel/src/attribute-set.test.ts
```
