---
title: "Retire activesupport's clock holder now that Time.now is cheap"
status: draft
updated: 2026-09-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["activesupport"]
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

`packages/activesupport/src/time-travel.ts` exports `clock`, a holder with a
`now()` that trails production code reads the current time through.
`travel_to` stubs it (`testing/time-helpers.ts:179`) alongside Rails' own
receivers, `Time.now`, `Date.today` and `DateTime.now`. Its receipt is a
freeform `@noRailsEquivalent CONVERGEABLE — …`. The receipt says the holder
exists only because `Time.now` was too slow for the hot path, and it cites
`time-helpers-stub-date-and-datetime-clock`, which is closed.

`time-now-cheap-enough-for-the-clock-path` is done (trails#6890), so the stated
blocker has landed. Surfaced by trails#8004. Re-pointed here by
`retire-convergeable-receipts-citing-done-stories`.

## Acceptance criteria

- Measure `Time.now` on the `TimeWithZone` construction path against `clock.now`.
  If it is close, `currentTime` / `currentTimeInstant` read `Time.now`, as Rails
  reads `Time.now` (`active_support/core_ext/time/calculations.rb`
  `Time.current`), and `clock` and its `travel_to` stub are deleted.
- If it is not close, `block` this story with the measured numbers. Do not
  relabel the receipt PERMANENT.
