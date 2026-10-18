---
title: "distance_of_time_in_words computes over ::Time, not a JS Date"
status: in-progress
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9037
claim: "2026-10-18T18:14:53Z"
assignee: "actionview-helpers-umbrella-eager-load-and-final-sweep"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/helpers/date-helper.ts` `distanceOfTimeInWords` / `normalizeDistanceOfTimeArgumentToTime` compute over a JS `Date`. As a result:

- `normalize_distance_of_time_argument_to_time` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/date_helper.rb:699-707`) carries two invented arms inside its `else`, one for a JS `Date` and one for a `Temporal.Instant`. A `::Time` returned from `to_time` is also converted back to a JS Date through `toF`.
- The year arm (`date_helper.rb:129-132`) reads `getUTCFullYear()` / `getUTCMonth()` where Rails reads `from_time.year` / `.month` in the Time's own zone.

These came up in review of trails#9013.

## Acceptance criteria

- [ ] `normalizeDistanceOfTimeArgumentToTime` returns the `::Time` from `@blazetrails/date` (`Time.at(value)` / `value.toTime()`) with Rails' three arms only. The JS `Date` / `Temporal.Instant` arms are removed or reached through a `toTime` they answer.
- [ ] The subtraction and the `year` / `month` reads use the Time's own methods, as Rails does.
- [ ] The date-helper tests stay green.
