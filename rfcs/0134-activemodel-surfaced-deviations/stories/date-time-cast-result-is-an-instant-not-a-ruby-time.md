---
title: "Type::DateTime / Type::Time cast results are a Temporal.Instant, not a Ruby ::Time"
status: done
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: 7537
claim: "2026-09-05T21:06:57Z"
assignee: "date-time-cast-result-is-an-instant-not-a-ruby-time"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7512 (`time-cast-result-cannot-model-a-zoned-ruby-time`), which
ported `Helpers::TimeValue#serialize_cast_value`'s `is_utc?` arm
(`activemodel/lib/active_model/type/helpers/time_value.rb:10-22`).

Rails' `Type::DateTime#cast_value` and `Type::Time#cast_value`
(`activemodel/lib/active_model/type/date_time.rb:53-58`,
`activemodel/lib/active_model/type/time.rb:35-49`) answer a Ruby `::Time` —
an absolute instant that also carries a zone, so it answers `utc?`, `getutc`
and `getlocal`. trails answers a `Temporal.Instant`, which carries no zone at
all (`packages/activemodel/src/type/date-time.ts` `castValue`,
`packages/activemodel/src/type/time.ts` `castValue`).

`@blazetrails/date`'s `Time` IS the faithful port of Ruby's `::Time`
(`packages/date/src/time.ts:1089,1119,1132` for `utc?`/`getutc`/`getlocal`),
and since #7512 the quoting layer accepts one — Rails' own
`when Date, Time` at
`activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:85`.
So nothing structural blocks the cast result being a `Time`; what blocks it is
size. #7512 measured ~512 `Temporal.Instant` references across 94 test files in
activerecord/activemodel alone, which is why it converged the serialize seam
only and left the cast seam here.

The visible cost today is `toTime` in
`packages/activemodel/src/type/helpers/time-value.ts` — a trails-only dispatch
that lifts a zoneless `Temporal.Instant` into a `Time` so
`serialize_cast_value`'s `is_utc?` arm has a receiver that answers the three
Ruby sends. Rails needs no such dispatch, because its `value` is already a
`::Time`. Converge the cast result and `toTime` deletes itself.

## Converged shape

`Type::DateTime#castValue` and `Type::Time#castValue` answer a
`@blazetrails/date` `Time`; `DateTimeCastResult` names it; `newTime` and
`fastStringToTime` (`type/helpers/time-value.ts`) answer one rather than an
`Instant`; `toTime` and `timeAt` are deleted and `serializeCastValue`'s arm
operates on `value` directly, exactly as `time_value.rb:12-19` does.

This is large and touches every consumer that reads a datetime attribute, so
it likely wants splitting into per-package stories once scoped.

## Acceptance criteria

- [ ] `Type::DateTime` / `Type::Time` cast results are a Ruby `Time`, not a
      `Temporal.Instant`.
- [ ] `toTime` / `timeAt` in `type/helpers/time-value.ts` are deleted and
      `serializeCastValue` sends `utc?` / `getutc` / `getlocal` to `value`.
- [ ] No test renames.
