---
title: "prepare_value_for_validation calls record_attribute_changed_in_place? as a module function, not through the validator"
status: draft
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`record_attribute_changed_in_place?` is a private INSTANCE method on
`NumericalityValidator` (`vendor/rails/activemodel/lib/active_model/validations/numericality.rb:141-144`),
and `prepare_value_for_validation` calls it as one — an implicit-self send, so a
subclass validator can override it and the override takes effect:

```ruby
def prepare_value_for_validation(value, record, attr_name)
  return value if record_attribute_changed_in_place?(record, attr_name)
```

trails calls the module-level function directly rather than dispatching through
the receiver (`packages/activemodel/src/validations/numericality.ts:251`):

```ts
if (isRecordAttributeChangedInPlace(record, attrName)) return value;
```

The function IS assigned to the prototype
(`numericality.ts:299`, `NumericalityValidator.prototype.isRecordAttributeChangedInPlace =
isRecordAttributeChangedInPlace`) and declared on the class
(`numericality.ts:43`), so the dispatchable seat exists and is simply not used —
a subclass override is silently ignored. The same is true of the sibling
`prepareValueForValidation`, whose `this` is typed `unknown` and whose test call
sites pass `undefined` for it, which is why the direct call was the shape that
fit when the short-circuit was wired.

Landed this way in PR #7478 (story
`wire-numericality-changed-in-place-short-circuit`); the guard's placement and
behavior match Rails, only its dispatch does not.

## Converged shape

Dispatch through the receiver the way Rails' implicit self does:

```ts
if (this.isRecordAttributeChangedInPlace(record, attrName)) return value;
```

That requires `prepareValueForValidation`'s `this` to be typed as the validator
rather than `unknown`, and the two test call sites that invoke it as
`prepareValueForValidation.call(undefined, ...)`
(`numericality-validation.trails.test.ts:101,117`) to pass a validator instead.
Check whether the other `this: unknown` free functions in this file share the
problem and should move in the same pass — `filteredOptions`, `optionAsNumber`
and `isAllowOnlyInteger` are all prototype-assigned the same way.

## Acceptance criteria

- [ ] `prepareValueForValidation` reaches `isRecordAttributeChangedInPlace`
      through `this`, mirroring the implicit-self send at `numericality.rb:123`.
- [ ] A subclass of `NumericalityValidator` overriding
      `isRecordAttributeChangedInPlace` sees its override honored.
- [ ] `pnpm parity:api:calls` non-negative; numericality suites green in
      activemodel and activerecord.
