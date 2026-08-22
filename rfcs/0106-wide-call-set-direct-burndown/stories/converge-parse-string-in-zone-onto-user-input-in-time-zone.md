---
title: "converge-parse-string-in-zone-onto-user-input-in-time-zone"
status: in-progress
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6848
claim: "2026-08-21T23:50:30Z"
assignee: "converge-parse-string-in-zone-onto-user-input-in-time-zone"
blocked-by: null
closed-reason: null
---

## Context

`TimeZoneConverter#cast`'s string arm is Rails

```ruby
super(user_input_in_time_zone(value)) || super
```

(`activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:24`).
`user_input_in_time_zone` is `ActiveModel::Type::Helpers::TimeValue`'s
(`activemodel/lib/active_model/type/helpers/time_value.rb:42-44`), reached
through the DelegateClass hop to the subtype.

trails does NOT make that call. `packages/activerecord/src/attribute-methods/time-zone-conversion.ts:82-92`
parses the string through a file-local helper, `parseStringInZone`
(same file, :278-320), which is strictly richer than the shared
`userInputInTimeZone` in `packages/activemodel/src/type/helpers/time-value.ts:125`:

- explicit-offset strings (`Z`, `±HH:MM`, `±HHMM`, `±HH`) normalized to an
  `Temporal.Instant`
- DST disambiguation via `zone.local(...)` rather than
  `PlainDateTime#toZonedDateTime`
- date-only `YYYY-MM-DD` → midnight in the zone
- sub-millisecond precision re-added after `zone.local`

Routing the Rails call through `TimeValue#userInputInTimeZone` today would
regress all four. So the divergence is really in the _shared helper_: trails'
`userInputInTimeZone` is an under-port of `Object#in_time_zone`
(`activesupport/lib/active_support/core_ext/date_and_time/zones.rb:20-27`).

The call-set row for it now carries a per-site reason pointing here
(`scripts/api-compare/call-mismatches-exclude/activerecord/attribute-methods/time-zone-conversion.json`,
`cast` / `user_input_in_time_zone`), filed out of RFC 0106 wave 4g.

## Acceptance criteria

- [ ] `packages/activemodel/src/type/helpers/time-value.ts`'s `userInputInTimeZone`
      handles the four cases `parseStringInZone` handles, matching
      `date_and_time/zones.rb:20-27` + `String#in_time_zone`
      (`core_ext/string/zones.rb`).
- [ ] `time-zone-conversion.ts`'s string arm calls the subtype's
      `userInputInTimeZone` and then `super`, i.e.
      `this._subtype.cast(this._subtype.userInputInTimeZone(value)) ?? this._subtype.cast(value)`,
      mirroring `super(user_input_in_time_zone(value)) || super`.
- [ ] `parseStringInZone` is deleted (it has no Rails counterpart).
- [ ] The `cast` / `user_input_in_time_zone` row is deleted from
      `call-mismatches-exclude/activerecord/attribute-methods/time-zone-conversion.json`
      by hand via `serializeBaseline`, then `pnpm parity:api:calls:tighten`.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — the time-zone-aware
      attribute tests are adapter-sensitive.
