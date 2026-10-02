---
title: "ruby-compat has no Module#ancestors / Module#instance_method for a class receiver"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails PR 8366 (`activemodel-burn-extra-surface-to-zero`).

`ActiveModel::Type::SerializeCastValue::ClassMethods#serialize_cast_value_compatible?`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type/serialize_cast_value.rb:9-12`) is

```ruby
return @serialize_cast_value_compatible if defined?(@serialize_cast_value_compatible)
@serialize_cast_value_compatible = ancestors.index(instance_method(:serialize_cast_value).owner) <= ancestors.index(instance_method(:serialize).owner)
```

ruby-compat has no `Module#ancestors` and no `Module#instance_method` for a class receiver
(`packages/ruby-compat/src/object.ts` exports `rbModName`, `rbModToS`, `rbModSingletonP`,
`rbModPublicMethodDefined` and nothing else of the `rbMod*` family; `Module#instanceMethod` in
`packages/ruby-compat/src/include.ts` answers for a `Module` instance only). So the port in
`packages/activemodel/src/type/serialize-cast-value.ts` builds `ancestors` with a prototype-chain loop
and resolves the owner through a local `instanceMethod` closure, where Rails makes two core calls.

The MRI sources are `rb_mod_ancestors` (`vendor/ruby/v3.3.11/class.c`) and `rb_mod_instance_method`
(`vendor/ruby/v3.3.11/proc.c:2190`), whose `UnboundMethod#owner` is the class or module holding the
method entry. In trails an included plain-object or class module is copied onto the includer's
prototype, and only a live `Module` contributes its own link, so `ancestors` has to decide what a
copied module's position is before it can be a general primitive.

## Acceptance criteria

- [ ] ruby-compat exports the `Module#ancestors` and `Module#instance_method` ports for a class receiver, each with its MRI citation and `@noRailsEquivalent PERMANENT` receipt.
- [ ] `serializeCastValueCompatible` reads `ancestors.indexOf(instanceMethod(...).owner)` through them, with no local loop or closure.
- [ ] `packages/activemodel/src/type/serialize-cast-value.test.ts` and `packages/activemodel/src/type.trails.test.ts` stay green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm vitest run packages/activemodel/src/type/serialize-cast-value.test.ts packages/activemodel/src/type.trails.test.ts
```
