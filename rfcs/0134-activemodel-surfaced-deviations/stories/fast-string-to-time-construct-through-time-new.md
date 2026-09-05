---
title: "fast-string-to-time-construct-through-time-new"
status: done
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel", "date"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 7509
claim: "2026-09-05T03:42:13Z"
assignee: "fast-string-to-time-construct-through-time-new"
blocked-by: null
closed-reason: null
---

## Context

`fast_string_to_time`
(`vendor/rails/activemodel/lib/active_model/type/helpers/time_value.rb:76-98`)
constructs through `::Time.new(string, in: "UTC")` / `::Time.new(string)`.
trails' `fastStringToTime`
(`packages/activemodel/src/type/helpers/time-value.ts:117`) parses the string
itself into a `Temporal.Instant`, so the body makes no `new` call — the one
row in
`scripts/api-compare/call-mismatches-exclude/activemodel/type/helpers/time-value.json`.

`@blazetrails/date`'s `Time.new` (`packages/date/src/time.ts:611`) is a
line-for-line mirror of MRI's `time_s_init`, including the String form, the
`in:` keyword and the `ArgumentError` arms — so the call Rails makes DOES
exist in trails. What blocks the swap is the seat: `fastStringToTime` is typed
`Temporal.Instant | null`, and its callers
(`type/date-time.ts:52`, `type/time.ts:72`) and the surrounding ActiveModel
time-type surface read that seat throughout.

The parse arms themselves were converged against MRI by the review story
`time-value-fast-string-to-time-review` (date-only string → nil; sub-second
floored at the nanosecond).

## Acceptance criteria

- `fastStringToTime` constructs through `Time.new(string, { in: "UTC" })` /
  `Time.new(string)` with the `ArgumentError` → `null` arm, matching
  `time_value.rb:76-98`.
- The `new` row in
  `scripts/api-compare/call-mismatches-exclude/activemodel/type/helpers/time-value.json`
  is deleted, and the stale mark tightened with `pnpm parity:api:calls:tighten`.
- `packages/activemodel/src/type/helpers/time-value.test.ts`,
  `type/date-time.test.ts` and `type/time.test.ts` stay green.
