---
title: "datetime-civil-sub-minute-offset-loses-instant-on-cast"
status: ready
updated: 2026-09-25
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

Surfaced while shipping `datetime-attribute-rejects-ruby-datetime-values`.

Rails' `test_saves_both_date_and_time`
(`vendor/rails/activerecord/test/cases/date_time_test.rb:27-42`) runs under
`with_env_tz "America/New_York"` and builds
`DateTime.civil(1807, 2, 10, 15, 30, 45, Rational(Time.local(...).utc_offset, 86400))`.
In 1807 New York is on LMT, so the offset is `-17762` seconds (-04:56:02). MRI
keeps it exactly (`ruby -rdate`: `DateTime#offset` is `-8881/43200`, `to_time.to_r`
equals `Time.local(...).to_r`).

trails' `DateTime.civil` (`packages/date/src/date.ts`, `static civil` on
`DateTime`) returns the Temporal seat via `DateTime#toDatetime`, which spells the
zone with `of2str` and so truncates the offset to `-04:56`. That truncation was
ratified by `datetime-seat-truncates-a-sub-minute-offset` (trails#6272), and
`date.trails.test.ts` ("names an instant the truncated offset moves...") pins
that the seat's instant moves by the dropped seconds. So the value
`ActiveModel::Type::DateTime#cast_value` receives is already 2s off, and the
saved row does not equal `Time.local(1807, 2, 10, 15, 30, 45)`.

The done story named a second option it did not take: narrow the default
return for a sub-minute `of` to the gem-shaped `DateTime`, the only value that
holds the exact seconds. `DateTimeType#castValue`
(`packages/activemodel/src/type/date-time.ts`) would then need an arm for the
gem-shaped `DateTime` (Rails' `cast_value` keeps a DateTime as-is and
`serialize_cast_value` calls `utc?` / `getutc` on it,
`activemodel/lib/active_model/type/helpers/time_value.rb:10-21`).

`packages/activerecord/src/date-time.test.ts` "saves both date and time" is
parked `it.skip` on this story with Rails' body verbatim.

## Acceptance criteria

- [ ] A `DateTime.civil` value with a sub-minute offset names MRI's instant
      when cast by a datetime attribute (either the seat or the value it hands
      `cast_value` carries the exact seconds).
- [ ] `date-time.test.ts` "saves both date and time" is un-skipped and green.
- [ ] `pnpm parity:api:extra --package date` clean; no new baseline rows.
