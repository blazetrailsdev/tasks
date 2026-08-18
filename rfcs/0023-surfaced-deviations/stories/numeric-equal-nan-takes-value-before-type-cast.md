---
title: "Numeric#changed? must pass new_value_before_type_cast to equal_nan?"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into activemodel-numeric-changed-passes-cast-value-to-equal-nan — same defect in the same body (numeric.rb:30-34: equal_nan? must receive new_value_before_type_cast)"
---

## Context

`ActiveModel::Type::Helpers::Numeric#changed?`
(`vendor/rails/activemodel/lib/active_model/type/helpers/numeric.rb:31-34`)
reads:

```ruby
def changed?(old_value, _new_value, new_value_before_type_cast)
  (super || number_to_non_number?(old_value, new_value_before_type_cast)) &&
    !equal_nan?(old_value, new_value_before_type_cast)
end
```

Rails passes `new_value_before_type_cast` to `equal_nan?`. Trails passes the
CAST new value instead, at
`packages/activemodel/src/type/helpers/numeric.ts` in `applyNumericMixin`'s
`isChanged`.

The difference is observable. Rails' `equal_nan?` also requires
`old_value.instance_of?(new_value.class)`, so writing the STRING `"NaN"` over a
Float NaN attribute IS a change in Rails (String is not Float, and
`Float::NAN != Float::NAN` makes `super` true). Under trails' cast-value
variant it is NOT a change.

The deviation was surfaced and documented during #5374 but deliberately left
alone: converging it flips six existing assertions that currently pin the
cast-value behaviour.

- `packages/activemodel/src/type/float.test.ts` -
  `isChanged returns false for NaN-to-NaN when raw is "NaN" string - equal_nan? uses cast value`
- `packages/activemodel/src/dirty.test.ts` - five cases in
  `numeric type.isChanged integration via dirty tracking` and
  `clearAttributeChanges clears forced-dirty state`, each doing
  `m.writeAttribute("ratio", "NaN")` after a Float NaN cast.

Those trails-invented test names encode the deviation rather than Rails
behaviour, so converging means rewriting them against
`vendor/rails/activemodel/test/cases/type/` and
`vendor/rails/activemodel/test/cases/dirty_test.rb` rather than preserving them.

## Acceptance criteria

- `applyNumericMixin`'s `isChanged` passes `newValueBeforeTypeCast` to
  `isEqualNan`, matching numeric.rb:31-34.
- The six pinning assertions are re-derived from the Rails tests, not merely
  inverted; test names that describe the deviation are replaced with the Rails
  names they should have had.
- Decimal's `"NaN"` sentinel handling (added in #5374) keeps working: the
  sentinel stands in for BigDecimal NaN and mixed representations still count
  as changed.
- `pnpm parity:api:calls` baseline does not grow; parity:test delta is
  non-negative.
