---
title: "port-time-value-type-cast-for-schema"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6797
claim: "2026-08-20T23:08:51Z"
assignee: "port-time-value-type-cast-for-schema"
blocked-by: null
closed-reason: null
---

## Context

`Helpers::TimeValue` defines six members; `type_cast_for_schema`
(`vendor/rails/activemodel/lib/active_model/type/helpers/time_value.rb:36-38`)
is the one trails does not port at all:

```ruby
def type_cast_for_schema(value)
  value.to_fs(:db).inspect
end
```

Surfaced while landing `converge-time-value-helper-to-a-real-mixin` (PR #6788),
which made `packages/activemodel/src/type/helpers/time-value.ts` a real module
carrying the other five members. With no port, `Type::DateTime` and `Type::Time`
inherit `ActiveModel::Type::Value#type_cast_for_schema`
(`packages/activemodel/src/type/value.ts:68`, `value.rb:132-134`'s
`value.inspect`) instead — so a schema dump of a datetime/time default renders
the Temporal value's `inspect`, not Rails' `to_fs(:db)` form
(`"2000-01-01 00:00:00"`).

`Type::Date` (`date.ts:40`) and `Type::Decimal` (`decimal.ts:18`) already carry
their own `type_cast_for_schema` overrides, so this is the last gap in the
family.

## Acceptance criteria

- [ ] `typeCastForSchema` is a member of the `TimeValue` module in
      `packages/activemodel/src/type/helpers/time-value.ts`, mirroring
      time_value.rb:36-38.
- [ ] `DateTimeType` / `TimeType` answer the `to_fs(:db)`-quoted form for a
      cast value, matching MRI (`ruby` is on PATH — verify rather than derive).
- [ ] `pnpm parity:api` delta non-negative; `parity:api:extra --package activemodel`
      does not grow.
