---
title: "date-to-time-returns-a-ruby-time"
status: draft
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
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

`@blazetrails/date` ports `Date#to_time` (`vendor/date/.../date_core.c` `date_to_time`)
as `toTime(): Temporal.ZonedDateTime` (`packages/date/src/date.ts:5591`, and the
DateTime override at `:6661`), where Ruby answers a `::Time` in the local zone.

So a caller that hands the result to Time-shaped code has to convert it.
`EtOrbi.make_from_date` (`vendor/et-orbi/v1.2.11/lib/et-orbi/make.rb:191-198`)
does `make_from_time(d.to_time, zone)`. The port in
`packages/et-orbi/src/make.ts` (`makeFromDate`) wraps the result in
`Time.at(d.toTime().epochMilliseconds / 1000)`, receipted
`@inventedArm at — CONVERGEABLE date-to-time-returns-a-ruby-time`.

## Acceptance criteria

- [ ] `Date#toTime` / `DateTime#toTime` return a `@blazetrails/date` `Time`, as
      `date_to_time` / `datetime_to_time` do; update callers that relied on the Temporal value.
- [ ] `makeFromDate` calls `makeFromTime(d.toTime(), zone)` directly and its
      `@inventedArm at` receipt is removed.
