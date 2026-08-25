---
title: "find_zone! numeric arm must scan utc_offset via TimeZone[], not stringify"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6232
claim: "2026-08-08T12:52:01Z"
assignee: "retire-sqlite-tasks-with-operation-adapter"
blocked-by: null
closed-reason: null
---

## Context

`Time.find_zone!` accepts a Numeric/Duration UTC offset — Rails routes it
through `ActiveSupport::TimeZone[]`, which for a Numeric argument does
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:244-246`):

```ruby
when Numeric, ActiveSupport::Duration
  arg *= 3600 if arg.abs <= 13
  all.find { |z| z.utc_offset == arg.to_i }
```

trails' `findZoneBang` (`packages/activesupport/src/time-zone-config.ts`)
instead has a bespoke numeric arm that stringifies the number and calls
`TimeZone.find(zone.toString())`, i.e. it looks the offset up as a _name_.
`Time.zone = -5` (the exact example zones.rb:23 documents) therefore raises
`ArgumentError` in trails where Rails resolves it to Eastern Time.

Surfaced by review of PR #6218 (which converged `Time.zone=` onto
`findZoneBang` but left `findZoneBang` itself untouched).

## Converged shape

- Move the Numeric/Duration handling into `TimeZone[]`'s port
  (`values/time-zone.ts`), where Rails has it — the hours-vs-seconds
  normalisation (`arg *= 3600 if arg.abs <= 13`) and the
  `all.find { |z| z.utc_offset == arg.to_i }` scan.
- Delete `findZoneBang`'s bespoke `typeof zone === "number"` arm; the Numeric
  case then falls out of the same `TimeZone[]` delegation Rails uses
  (`core_ext/time/zones.rb:80-90`).
- Keep the `ArgumentError "Invalid Timezone: #{time_zone}"` raise site and
  message Rails uses (zones.rb:88).

## Acceptance criteria

- `Time.zone = -5` and `Time.zone = -5.hours` resolve to the same zone Rails
  resolves them to; `findZone` returns null rather than raising for an
  unmatched offset.
- No `toString()`-based numeric arm remains in `findZoneBang`.
- `time-zone.test.ts` and `core-ext/time-with-zone.test.ts` stay green.
