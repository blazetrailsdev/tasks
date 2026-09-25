---
title: "PG timestamptz attribute leaves an assigned Date uncast"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8075
claim: "2026-09-25T01:44:13Z"
assignee: "nested-through-polymorphic-accessor-fidelity"
blocked-by: null
closed-reason: null
---

## Context

Surfaced porting `date_time_precision_test.rb › writing a date attribute timestamptz`
(PR trails#7926). On PostgreSQL under `withPostgresqlDatetimeType("timestamptz")`,
`Foo.create!(happened_at: Date.new(2001, 2, 3)).happened_at` comes back in trails as
the uncast `Temporal.PlainDate` it was given. On a plain `datetime` column it comes
back as a `Time`.

In Rails the attribute type for a `timestamptz` column is a DateTime/TimeWithZone
type, and its `cast_value` turns a Date into a Time
(`activemodel/lib/active_model/type/date_time.rb` `cast_value` / `fallback_string_to_time`,
and PG OID `timestamp_with_time_zone.rb`). So the reader returns a Time that
equals the date at midnight. The Rails test at
`vendor/rails/activerecord/test/cases/date_time_precision_test.rb:217-226`
(`assert_equal date, ...happened_at`) passes in Rails through Date/Time comparison.
The trails port passes only because the value was never cast.

## Acceptance criteria

- On PostgreSQL, a `timestamptz` attribute assigned a `PlainDate` reads back as a
  cast Time (the same class the `datetime` column returns), matching the Rails
  cast path.
- `date-time-precision.test.ts` twin still passes on PG.
