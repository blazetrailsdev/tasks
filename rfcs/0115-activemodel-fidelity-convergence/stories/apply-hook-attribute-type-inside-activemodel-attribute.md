---
title: "apply-hook-attribute-type-inside-activemodel-attribute"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6800
claim: "2026-08-21T00:42:06Z"
assignee: "apply-hook-attribute-type-inside-activemodel-attribute"
blocked-by: null
closed-reason: null
---

## Context

Rails applies `hook_attribute_type` inside `attribute` itself, before the
`PendingType` is queued
(`vendor/rails/activemodel/lib/active_model/attribute_registration.rb:12-18`):

```ruby
def attribute(name, type = nil, default: (no_default = true), **options)
  name = resolve_attribute_name(name)
  type = resolve_type_name(type, **options) if type.is_a?(Symbol)
  type = hook_attribute_type(name, type) if type

  pending_attribute_modifications << PendingType.new(name, type) if type || no_default
```

So the hooked type — `TimeZoneConverter` (time_zone_conversion.rb:67-73),
`LockingType` (locking/optimistic.rb) — IS the declared type, everywhere it is
read.

trails' ActiveModel `attribute` (`packages/activemodel/src/attributes.ts:102-176`)
never calls `hookAttributeType`; instead ActiveRecord's `Base.attribute` override
(`packages/activerecord/src/base.ts:1195-1210`) re-reads the definition after
`super.attribute(...)`, hooks it, and pushes a `decorateAttributes` decorator
that returns the hooked type. Rails has no such decorator, and the gate
comment there ("re-hooking would double-wrap unconditional wrappers like
LockingType") exists only because the hook runs in the wrong place.

Until #6791 the difference was masked by `decorateAttributes`' eager
`_attributeDefinitions` bake, which wrote the hooked type back into the
definitions map. With that bake retired, `_attributeDefinitions` keeps the raw
declared type and only `type_for_attribute` (the replayed attribute set) sees
the wrap — which is what Rails' own tests read
(`vendor/rails/activerecord/test/cases/attribute_methods_test.rb:942-943,976-978`
assert `model.type_for_attribute(:bonus_time)` is a `TimeZoneConverter`), so
trails' `time-zone-conversion.test.ts` was moved onto that reader.

## Acceptance criteria

- ActiveModel's `attribute` calls `hookAttributeType(name, type)` where Rails
  does (attribute_registration.rb:15), so the queued `PendingType` carries the
  hooked type.
- ActiveRecord's `Base.attribute` no longer re-hooks and no longer pushes a
  `decorateAttributes` decorator for the hook; the `typeWasProvided` gate and
  its double-wrap comment go with it.
- Time-zone and locking wraps still resolve through `type_for_attribute`, and
  `_attributeDefinitions` carries the hooked type again — verify against
  `time-zone-conversion.test.ts` and `locking` coverage without renaming tests.
