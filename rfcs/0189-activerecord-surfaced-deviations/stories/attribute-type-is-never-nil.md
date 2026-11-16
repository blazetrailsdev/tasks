---
title: "attribute-type-is-never-nil"
status: draft
updated: 2026-11-16
rfc: "0189-activerecord-surfaced-deviations"
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

## Context

`Attribute#type` is declared `ValueType | null` in `packages/activemodel/lib/attribute.ts:31` (constructor `:40`, factories `:49`, `:58`, `uninitialized` `:67`). Rails never stores nil there: `Attribute::Null#initialize` passes `Type.default_value` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb`, `class Null`), and every other constructor receives a type. So `AttributeSet#castTypes` (`packages/activemodel/lib/attribute-set.ts:54`) is typed `ValueType | null`, and `AttributeRegistration.attributeTypes` (`packages/activemodel/lib/attribute-registration.ts:163`) has to cast it to `ValueType` (trails#10194).

## Acceptance criteria

- [ ] `Attribute#type` and its constructor/factory parameters are typed `ValueType`; `Null` / `uninitialized` callers pass `Type.defaultValue()` where Rails does.
- [ ] `AttributeSet#castTypes` returns `Record<string, ValueType> | Hash<string, ValueType>`, and the cast in `attributeTypes` is removed.
- [ ] `pnpm typecheck` green.
