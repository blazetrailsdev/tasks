---
title: "time-accepts-duck-typed-zone-objects"
status: draft
updated: 2026-09-25
rfc: "0123-blocked-convergence-holding"
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

Rails' `TimeWithZone#to_time` under `preserve_timezone == :zone` calls
`getlocal(time_zone)` with the `ActiveSupport::TimeZone` object itself
(`activesupport/lib/active_support/time_with_zone.rb:495`), and MRI keeps that
object as `vtm.zone` (`vendor/ruby/time.c:5020-5037` `time_zone`), so
`time_with_zone_test.rb:556` asserts `assert_equal @time_zone, time.zone`.

trails' `TimeWithZone#toTime` (`packages/activesupport/src/time-with-zone.ts`,
`toTime`) passes `TimeZone.find(this.timeZone)!.tzinfo.identifier`, a String.
After `Time#zone` started returning a zone object for a zone-object time, that
object is `@blazetrails/date`'s `Timezone` wrapping the identifier, not the
`ActiveSupport::TimeZone`. The ported test (`core-ext/time-with-zone.test.ts`,
"to time with preserve timezone using zone") therefore compares identifiers,
not the zone object.

The gap underneath: `Time` accepts only its own `Timezone` (and an IANA String)
as a zone object. MRI accepts any object answering `utc_to_local` /
`local_to_utc` (`zone_localtime`, `time.c:2415`; `zone_timelocal`), and
`ActiveSupport::TimeZone#utc_to_local` / `#local_to_utc` exist in
`packages/activesupport/src/values/time-zone.ts`.

## Acceptance criteria

- [ ] `Time.new(..., zone)` / `getlocal(zone)` / `in:` accept a duck-typed zone
      object and `Time#zone` answers that same object.
- [ ] `TimeWithZone#toTime` passes `this.timeZone` to `getlocal`, as Rails does.
- [ ] "to time with preserve timezone using zone" asserts `time.zone` equals
      the TimeZone, as `time_with_zone_test.rb:556` does.
