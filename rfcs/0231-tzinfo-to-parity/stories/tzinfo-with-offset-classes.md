---
title: "Port WithOffset, TimeWithOffset, DateTimeWithOffset and TimestampWithOffset"
status: blocked
updated: 2026-11-12
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - tzinfo-timestamp
  - date-time-localtime-and-datetime-jd
  - date-time-subclass-preserving-surface
deps-rfc: []
est-loc: 600
priority: 3
pr: null
claim: "2026-11-12T11:41:33Z"
assignee: "tzinfo-with-offset-classes"
blocked-by: "waits on date-time-localtime-and-datetime-jd and date-time-subclass-preserving-surface: Time#localtime/gmtime/round/to_a, subclass-preserving Time.at/getlocal, DateTime.jd/to_datetime answering DateTime"
closed-reason: null
---

## Context

No TS files for `vendor/tzinfo/v2.0.6/lib/tzinfo/with_offset.rb` (2), `time_with_offset.rb` (14),
`datetime_with_offset.rb` (14), `timestamp_with_offset.rb` (7). Tests:
`tc_with_offset.rb`, `tc_time_with_offset.rb`, `tc_datetime_with_offset.rb`,
`tc_timestamp_with_offset.rb`. `TimeWithOffset` subclasses `::Time` and
`DateTimeWithOffset` `::DateTime`, the ruby-compat / `@blazetrails/date`
classes.

## Acceptance criteria

- [ ] The four files are ported with every member at its Ruby name, as real
      subclasses of trails' `Time` / `DateTime`.
- [ ] The four test files are ported by name.
