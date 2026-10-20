---
title: "date-iso8601-answers-gem-shaped-date"
status: done
updated: 2026-10-20
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9130
claim: "2026-10-20T14:04:29Z"
assignee: "date-iso8601-answers-gem-shaped-date"
blocked-by: null
closed-reason: null
---

# Date.iso8601 / DateTime.iso8601 answer Temporal values, not gem-shaped Date / DateTime

## Context

`Date.iso8601` (`packages/date/src/date.ts:4902-4904`) returns `dNewByFrags(...).toDate()`, a `Temporal.PlainDate`, and `DateTime.civil` / `DateTime.iso8601` answer `Temporal.PlainDateTime | Temporal.ZonedDateTime`. In the date gem `Date.iso8601` returns a `Date` (`vendor/ruby` date_core.c `date_s_iso8601`).

Surfaced porting `ActiveJob::Serializers::DateSerializer` / `DateTimeSerializer` (`activejob/lib/active_job/serializers/date_serializer.rb:10-12`, `date_time_serializer.rb:6-8`): a round-tripped `Date` comes back as a `Temporal.PlainDate`, which `DateSerializer#serialize?` (`is_a?(Date)`) no longer recognises, so a job argument cannot be serialized twice.

## Acceptance criteria

- [ ] `Date.iso8601` answers a `Date` and `DateTime.iso8601` a `DateTime`, or the RFC 0088 decision is recorded with the reason.
- [ ] `packages/activejob/src/serializers/time-serializers.trails.test.ts` asserts `toBeInstanceOf(Date)` / `toBeInstanceOf(DateTime)` on the round-tripped values.
