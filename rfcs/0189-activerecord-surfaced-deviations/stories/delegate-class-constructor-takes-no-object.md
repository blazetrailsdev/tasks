---
title: "ruby-compat: DelegateClass's constructor is typed with no parameters, so TimeZoneConverter carries a pass-through constructor Rails lacks"
status: draft
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: [ruby-compat, activerecord]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Delegator#initialize(obj)` takes the object to delegate to, so a `DelegateClass` subclass with no `initialize` of its own is built with that object. `ActiveRecord::AttributeMethods::TimeZoneConversion::TimeZoneConverter < DelegateClass(Type::Value)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:8`) defines no `initialize` and is built as `TimeZoneConverter.new(cast_type)`.

The class `DelegateClass()` returns (`packages/ruby-compat/src/delegate.ts:97`) declares `constructor(...args: ConstructorParameters<MixinBase>)`, which types as no parameters, although its body reads `args[0]` and calls `__setobj__` with it. So `new TimeZoneConverter(castType)` does not type-check unless the subclass declares its own constructor, and `packages/activerecord/src/attribute-methods/time-zone-conversion.ts:53` declares a pass-through `constructor(subtype)` that Rails does not have.

Not every subclass constructor is a pass-through: `LockingType`'s is the port of Rails' `def self.new(subtype)` (`locking/optimistic.rb:207`), and `Serialized`, `Normalization`'s `NormalizedValueType`, `Type::Time` and the adapters' `TypeMetadata` constructors take Rails' own `initialize` arguments.

## Acceptance criteria

- [ ] `DelegateClass()`'s constructor is typed `(obj: unknown)`, matching `Delegator#initialize(obj)`, with its MRI / delegate.rb citation.
- [ ] Each `extends DelegateClass(...)` constructor whose Rails class defines no `initialize` and no `self.new` is deleted. `TimeZoneConverter`'s is one; check each of the 9 subclasses.
- [ ] `pnpm parity:api:extra --package activerecord` and `pnpm parity:api:calls` show no new row.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:extra:gate && pnpm vitest run packages/ruby-compat/src/delegate packages/activerecord/src/attribute-methods/time-zone-conversion
```
