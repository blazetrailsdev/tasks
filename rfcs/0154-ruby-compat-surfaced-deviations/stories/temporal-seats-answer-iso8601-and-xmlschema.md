---
title: "temporal-seats-answer-iso8601-and-xmlschema"
status: done
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: trails#9028
claim: "2026-10-18T14:40:31Z"
assignee: "temporal-seats-answer-iso8601-and-xmlschema"
blocked-by: null
closed-reason: null
---

## Context

RFC 0088 made Temporal the default return (`Date.today` → `Temporal.PlainDate`,
`DateTime.now` → `ZonedDateTime`). A Ruby caller still sends `iso8601` /
`xmlschema` to those values:

- ActiveJob's `DateSerializer#serialize` calls `date.iso8601`
  (`vendor/rails/v8.0.2/activejob/lib/active_job/serializers/date_serializer.rb`).
- `TimeObjectSerializer` calls `time.iso8601(9)`
  (`vendor/rails/v8.0.2/activejob/lib/active_job/serializers/time_object_serializer.rb`).

`packages/date` binds these only on its Ruby-shaped classes
(`packages/date/src/date.ts:5694`, `:6740`; `packages/date/src/time.ts:1685`,
`:1901`). `TEMPORAL_METHOD_TABLE` has no entry for them, so
`rbFSend(plainDate, "iso8601")` raises. The existing pattern is
`packages/date/src/time.ts:1917-1930` (`isUtc`/`getutc` on `Temporal.Instant`
and `Date`). The codegen generator already lowers a method registered in that
table to `rbFSend` (`scripts/codegen/src/gem.ts:78-101`), so registering these
makes the generated serializers accept Temporal values with no generator
change.

## Acceptance criteria

- `TEMPORAL_METHOD_TABLE` binds `iso8601` and `xmlschema` with Ruby's output:
  - `Temporal.PlainDate`: `Date#iso8601`, `yyyy-mm-dd`.
  - `PlainDateTime` and `ZonedDateTime`: `DateTime#iso8601(n)`, with the
    offset, `n` fraction digits.
  - `Instant` and JS `Date`: `Time#xmlschema(n)`, in the local zone, `Z` for UTC.
- Each is checked against MRI output (ruby 3.3.11 is on PATH) for one value per
  type, including `n = 9`.
- `rbFSend(Date.today(), "iso8601")` and `rbFSend(DateTime.now(), "iso8601", 9)`
  return strings that round-trip through `Date.iso8601` / `DateTime.iso8601`.
