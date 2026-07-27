---
title: "Route DateTimeType.castValue through fastStringToTime/newTime"
status: ready
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/type/date-time.ts` `parseString` reimplements string
parsing inline (normalize → offset check → `Instant.from` /
`PlainDateTime.from` in the configured zone), duplicating
`fastStringToTime` in `packages/activemodel/src/type/helpers/time-value.ts`.
Both were updated in #5402 to branch on the receiver's `isUtc`, so the
duplication is now maintained in two places.

In Rails, `Type::DateTime#cast_value` calls `fast_string_to_time(value)` /
`fallback_string_to_time(value)` from the mixed-in `Helpers::TimeValue`
(`vendor/rails/activemodel/lib/active_model/type/date_time.rb:24-39`,
`.../helpers/time_value.rb:91-94`), so there is exactly one implementation.
As a result `newTime` and `fastStringToTime` are currently unreachable from
trails `src/` — only `time-value.test.ts` calls them.

## Acceptance criteria

- `DateTimeType.castValue` routes through `fastStringToTime` (and `newTime`
  for the multiparameter path) as methods on the receiver, per the
  `this`-typed mixin convention.
- The inline duplicate in `parseString` is deleted.
- `newTime` / `fastStringToTime` are reachable from `src/`, not test-only.
- Existing activemodel and activerecord datetime tests pass with names
  unchanged.
