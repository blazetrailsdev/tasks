---
title: "DateAndTime::Calculations hour/min/sec/nsec + overloads for DateTime receivers"
status: draft
updated: 2026-09-16
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR trails#7839 gave `packages/activesupport/src/core-ext/date-and-time/calculations.ts` a DateTime (`Temporal.PlainDateTime` / `ZonedDateTime`) branch in `advance`, `change`, `toDate`, `classCurrent`, `toInstant`, `firstHour`, `lastHour` and `beginningOfWeek`. That is how Ruby behaves, because `DateTime < Date` resolves those methods through `DateAndTime::Calculations` and DateTime's own methods (`activesupport/lib/active_support/core_ext/date_time/calculations.rb`).

Some of the private readers in that file still have no DateTime branch:

- `hour` / `min` / `sec` / `nsec` return `0` / `undefined` for anything that isn't a JS `Date`. So `copyTimeTo` (Rails `date_and_time/calculations.rb:370-372`, `other.change(hour: hour, min: min, sec: sec, nsec: try(:nsec))`) drops the time of day for a DateTime receiver. As a result, `prevWeek` / `nextWeek` with `sameTime: true` and `prevWeekday` / `nextWeekday` return midnight where Rails keeps the receiver's time.
- The exported overload sets for `lastYear`, `nextYear`, `beginningOfMonth`, `beginningOfYear`, `endOfYear`, `endOfQuarter`, `lastMonth` and `nextWeek` declare no `DateTime` signature. `prevWeek`, `endOfMonth`, `prevQuarter` and `nextQuarter` now do.

## Acceptance criteria

- `hour` / `min` / `sec` / `nsec` read a DateTime receiver's fields, so `copyTimeTo` keeps its time the way `date_and_time/calculations.rb:370-372` does.
- Each DateAndTime::Calculations export reachable with a DateTime receiver declares a `DateTime` overload.
- A `date_time_ext_test.rb` / `date_and_time_behavior.rb` case covers `sameTime: true` on a DateTime.
