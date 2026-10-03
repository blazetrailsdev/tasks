---
title: "Attribute#initialize_dup hand-rolls @value.dup in a dupValue helper Rails does not have"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8434
claim: "2026-10-03T01:55:21Z"
assignee: "call-args-gate-aligns-the-receiver-of-function-form-sort"
blocked-by: null
closed-reason: null
---

## Context

Read while shipping `deep-dup-has-no-object-arm-so-classes-hand-write-it`.

`Attribute#initialize_dup`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb:155-159`) is

```ruby
def initialize_dup(other)
  if @value&.duplicable?
    @value = @value.dup
  end
end
```

`packages/activemodel/src/attribute.ts` ports the guard but replaces the `dup` send with a
module-private `dupValue` helper Rails does not have. It copies an Array, a `Map`, a `Set` and a
plain object, and returns every other value itself, where Ruby dups any duplicable value (a
`Time`, a `Date`, a `BigDecimal`, a `Range`, a record).

`dupValue` existed because `rbObjDup` returned a broken copy of a JS `Date`, `Map` or `Set`. That
is fixed: `rbObjAlloc` (`packages/ruby-compat/src/include.ts`) allocates those from the receiver,
and `Time`, `Date` and `TimeWithZone` answer `dup`.

## Acceptance criteria

- [ ] `Attribute#initializeDup` sends `dup` to `this._value` (the receiver's own `dup()` when it
      defines one, else `rbObjDup`), and `dupValue` is deleted.
- [ ] A cast value that is a `Time`, a `Date` or a class instance is a distinct object after
      `attribute.dup`, as it is in Rails.
- [ ] `attribute.trails.test.ts`, `attribute-set.test.ts`, `dirty.test.ts` and activerecord's
      `dup.test.ts` stay green.
