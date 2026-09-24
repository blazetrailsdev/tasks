---
title: "datetime-attribute-rejects-ruby-datetime-values"
status: draft
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `test_saves_both_date_and_time` (`vendor/rails/activerecord/test/cases/date_time_test.rb:27-42`)
assigns `DateTime.civil(*(time_values + [local_offset]))`, and
`test_assign_in_local_timezone` (`:75-81`) assigns `DateTime.civil(2017, 3, 1, 12, 0, 0)`.
`ActiveModel::Type::DateTime#cast_value` (`activemodel/lib/active_model/type/date_time.rb:54-59`)
keeps a DateTime as-is, and `serialize_cast_value`
(`activemodel/lib/active_model/type/helpers/time_value.rb`) calls `utc?` / `getutc` on it,
which ActiveSupport's DateTime core-ext answers.

In trails `DateTime.civil` (`packages/date/src/date.ts` `static civil`) returns a
`Temporal.PlainDateTime | Temporal.ZonedDateTime`. `DateTimeType#castValue`
(`packages/activemodel/src/type/date-time.ts`) converts only `Date`, `Temporal.Instant` and
`Temporal.PlainDateTime`; a `ZonedDateTime` passes through and
`serializeCastValue` (`packages/activemodel/src/type/helpers/time-value.ts:29`) throws
`TypeError: time.isUtc is not a function` on save. A PlainDateTime from
`DateTime.civil(2017, 3, 1, 12, 0, 0)` is read as local wall time where Ruby's DateTime
has offset 0 (UTC).

`packages/activerecord/src/date-time.test.ts` "saves both date and time" and
"assign in local timezone" therefore assign `Time.new(..., offset)` / `Time.local(...)`
instead of Rails' `DateTime.civil`.

## Acceptance criteria

- [ ] A trails `DateTime` value (a `DateTime.civil` result) assigned to a datetime
      attribute casts and serializes the way Rails' DateTime does (`utc?` / `getutc`),
      honoring its offset.
- [ ] `date-time.test.ts` "saves both date and time" and "assign in local timezone"
      build their values with `DateTime.civil` as Rails does, and pass.
