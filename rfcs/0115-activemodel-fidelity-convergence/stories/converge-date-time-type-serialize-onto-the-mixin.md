---
title: "Drop the DateType/DateTimeType/TimeType serialize copies the AcceptsMultiparameterTime mixin already provides"
status: ready
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
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

Surfaced while landing PR #6778 (`converge-accepts-multiparameter-time-to-a-real-mixin`).

`Helpers::AcceptsMultiparameterTime::InstanceMethods` defines `serialize` and
`serialize_cast_value` (`vendor/rails/activemodel/lib/active_model/type/helpers/accepts_multiparameter_time.rb:9-15`),
and Rails' `Type::Date` / `Type::DateTime` / `Type::Time` do NOT redefine them
in their own class bodies — the mixin's versions are what answer:

```ruby
def serialize(value)
  serialize_cast_value(cast(value))
end

def serialize_cast_value(value)
  value
end
```

trails still carries hand-spelled class-body copies, which under Ruby's
ancestry rules outrank the mixin and so change which body runs:

- `packages/activemodel/src/type/date.ts` — `serialize` (`return this.cast(value)`,
  not `serializeCastValue(cast(value))`) and `serializeCastValue`
- `packages/activemodel/src/type/date-time.ts` — `serialize` / `serializeCastValue`
- `packages/activemodel/src/type/time.ts` — `serialize` / `serializeCastValue`

PR #6778 dropped the `cast` / `assert_valid_value` /
`value_constructed_by_mass_assignment?` copies (that was its stated scope) and
deliberately left these two, because `serialize_cast_value` genuinely differs
per type: `Time` and `DateTime` apply `TimeValue#serialize_cast_value`'s
`apply_seconds_precision` (`activemodel/lib/active_model/type/helpers/time_value.rb`),
which IS a real Rails override. `Date`'s pair is the one with no Rails
counterpart, and `serialize` is the shape to check on all three.

Note `ValueType.serializeCastValueCompatible` (`type/value.ts`) decides its
answer by comparing the prototype-chain DEPTH at which `serialize` and
`serializeCastValue` are defined, so moving either half between the class body
and the mixin carrier moves that depth — re-check the predicate's answer for
all three types after the change (`serialize_cast_value.rb:9-12`).

## Converged shape

Each type keeps only the `serialize` / `serialize_cast_value` halves Rails
actually defines in that type (or in `Helpers::TimeValue`), and inherits the
rest from the `AcceptsMultiparameterTime` mixin included at class definition.
`Date`'s `serialize` in particular routes through `serializeCastValue(cast(value))`
rather than bare `cast(value)`.

## Acceptance criteria

- [ ] `DateType` / `DateTimeType` / `TimeType` define `serialize` /
      `serializeCastValue` only where Rails does, with the Rails body.
- [ ] `serializeCastValueCompatible` answers the same for all three types
      before and after (assert it in a test if it is not already covered).
- [ ] `pnpm parity:api:calls` / `:args` clean;
      `pnpm parity:api:extra --package activemodel` does not grow.
