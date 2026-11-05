---
title: "TimeWithZone#in_time_zone delegates to utc.in_time_zone"
status: in-progress
updated: 2026-11-05
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9758
claim: "2026-11-05T21:06:28Z"
assignee: "red-5f798086"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TimeWithZone#in_time_zone`
(`activesupport/lib/active_support/time_with_zone.rb:77-80`) is

```ruby
def in_time_zone(new_zone = ::Time.zone)
  return self if time_zone == new_zone
  utc.in_time_zone(new_zone)
end
```

`packages/activesupport/src/time-with-zone.ts` `inTimeZone` differs in two ways:

- A `null` `newZone` with no `Time.zone` set returns `this`. Rails instead
  delegates to `utc.in_time_zone(nil)`, and
  `DateAndTime::Zones#in_time_zone` (`core_ext/date_and_time/zones.rb`) then
  returns the UTC `Time`.
- It calls `findZoneBang` and builds `new TimeWithZone(this._zoned.toInstant(), tz)`
  by hand. Rails delegates to `utc.in_time_zone(new_zone)`.

## Acceptance criteria

- `inTimeZone` returns `inTimeZone(this.utc(), newZone)` (the
  `core-ext/date-and-time/zones.ts` port) after the `rbEqual` short-circuit.
- The defaulting of `newZone` matches Rails' `::Time.zone` default argument.
