---
title: "AcceptsMultiparameterTime's Hash branch overrides cast in Rails, not cast_value"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6178
claim: "2026-08-07T16:02:16Z"
assignee: "i18n-locale-tag-rfc4646"
blocked-by: null
closed-reason: null
---

## Context

`Helpers::AcceptsMultiparameterTime::InstanceMethods` overrides **`cast`**, not
`cast_value`
(`activemodel/lib/active_model/type/helpers/accepts_multiparameter_time.rb:16-22`):

```ruby
def cast(value)
  if value.is_a?(Hash)
    value_from_multiparameter_assignment(value)
  else
    super(value)
  end
end
```

The port instead puts the Hash branch at the top of `cast_value` in both
temporal types:

- `packages/activemodel/src/type/time.ts` `castValue` — `if (isHash(value)) return this.valueFromMultiparameterAssignment(value);`
- `packages/activemodel/src/type/date-time.ts` `castValue` — same line

That is one layer too deep. `ValueType#cast` is
`value == null ? null : this.castValue(value)`, so today the two happen to agree
on the nil guard, but the branch is in the wrong method: a subclass that
overrides `cast` (as `ActiveRecord::Type::Time` and `DateTime` may grow to) sees
a Hash where Rails' `cast` would already have resolved it, and `cast_value`
carries a Hash arm its Rails counterpart never has. `assert_valid_value` is
already at the right level in the port, which makes the asymmetry visible.

Surfaced while rewriting `TimeType#castValue` line-for-line against
`time.rb:68-83` in PR #6154 — left alone there because the shape is shared with
`DateTimeType` and converging one alone would split the pair.

## Converged shape

`TimeType` and `DateTimeType` override `cast`, branching on `isHash` and
delegating to `super.cast(value)` otherwise, exactly as `InstanceMethods#cast`
does. `castValue` loses its Hash arm and matches `time.rb:68-83` /
`date_time.rb:66-75` with no extra branch.

Note Rails' `cast` here has no `return if value.nil?` — the nil guard lives in
`ActiveModel::Type::Value#cast` (`value.rb:53-55`), which is `super`. Keep the
port's guard where it is; only the Hash branch moves.

## Acceptance criteria

- [ ] `TimeType` and `DateTimeType` override `cast` with the Hash branch, per
      `accepts_multiparameter_time.rb:16-22`.
- [ ] Neither `castValue` contains an `isHash` branch.
- [ ] `packages/activemodel/src/type/time.test.ts` and `date-time.test.ts`
      multiparameter tests pass unchanged (they call `cast`, so the move is
      externally invisible).
