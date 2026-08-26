---
title: "Attribute#equals uses === on valueBeforeTypeCast where Rails uses Ruby =="
status: draft
updated: 2026-08-26
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `predications-between-bound-equality-is-reference-equality`
(PR #7067). That story converged Arel's `between` degenerate-range arm
(`activerecord/lib/arel/predications.rb:56`, `other.begin == other.end`) from JS
`===` onto `rbEqual`, the Ruby-`==` send. The story's motivating case was AR's
`RangeHandler` (`packages/activerecord/src/relation/predicate-builder/range-handler.ts`),
which builds both bounds with `buildBindAttribute` and hands them to `between`
— so `where(created_at: d..d)` should collapse to an `Equality`.

It still does not, because the divergence repeats one layer down.

`ActiveModel::Attribute#==` (`activemodel/lib/active_model/attribute.rb:114-119`):

```ruby
def ==(other)
  self.class == other.class &&
    name == other.name &&
    value_before_type_cast == other.value_before_type_cast &&
    type == other.type
end
alias eql? ==
```

Ruby `==` on `value_before_type_cast` and on `type` — value comparisons.

trails' `Attribute#equals` (`packages/activemodel/src/attribute.ts`, ~:227):

```ts
equals(other: Attribute): boolean {
  const typeEqual = this.type === other.type || this.type.constructor === other.type.constructor;
  return (
    this.constructor === other.constructor &&
    this.name === other.name &&
    this.valueBeforeTypeCast === other.valueBeforeTypeCast &&
    typeEqual
  );
}
```

Two deviations:

1. **`valueBeforeTypeCast === other.valueBeforeTypeCast`** is reference
   equality. Two attributes wrapping equal-valued `Temporal.PlainDate`s /
   `BigDecimal`s / any non-primitive compare unequal where Rails compares them
   equal. This is exactly the `===`-for-`==` class RFC 0082 tracks, and it is
   now load-bearing on the `between` path.
2. **`typeEqual` widens the `type == other.type` arm** with a
   `constructor`-identity fallback that has no Rails counterpart
   (attribute.rb:118 is a plain `==`). It was presumably added because two
   separately-constructed type instances are not `===`; the Rails-faithful fix
   is for the type objects to answer `==` (`ActiveModel::Type::Value#==` is
   `self.class == other.class && precision == other.precision && scale ==
   other.scale && limit == other.limit`,
   `activemodel/lib/active_model/type/value.rb:113-118`), not for the caller to
   compare constructors.

`hash` (attribute.rb:121-123, `[self.class, name, value_before_type_cast,
type].hash`) should be checked for the same drift while in here.

## Converged shape

- `valueBeforeTypeCast` and `type` compare with `rbEqual`
  (`packages/activesupport/src/rb-equal.ts`), the settled Ruby-`==` send —
  the same call PR #7067 used in `predications.ts`.
- Delete the `typeEqual` widening and give `Type::Value` the `equals` Rails
  gives it (`type/value.rb:113-118`) if it lacks one, so `rbEqual` dispatches
  into it and the caller stops reaching for `constructor`.
- Verify the motivating case end to end: `where(col: d..d)` with equal
  `Temporal.PlainDate` bounds builds `Nodes::Equality`, not
  `Between(And(...))`.

Related idiom class: RFC 0082 (`0082-ruby-ts-idiom-conversion-classes`),
Ruby `==` vs JS `===`. Sibling instances already filed:
`binary-attribute-changed-uses-reference-equality`,
`numeric-equal-nan-takes-value-before-type-cast`.

## Acceptance criteria

- [ ] `Attribute#equals` compares `name`, `valueBeforeTypeCast` and `type` the
      way attribute.rb:114-119 does, with no `constructor` fallback.
- [ ] `Type::Value#equals` mirrors `type/value.rb:113-118`.
- [ ] A regression test that FAILS on the current `===`: two attributes over
      equal-valued non-primitive values compare equal, and `where(col: d..d)`
      builds `Nodes::Equality`.
- [ ] activemodel + AR attribute/dirty/where suites green on all three adapter
      lanes.
