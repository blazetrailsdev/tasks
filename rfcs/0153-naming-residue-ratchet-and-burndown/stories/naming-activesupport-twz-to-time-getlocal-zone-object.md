---
title: "TimeWithZone#to_time passes the TimeZone object to getlocal"
status: done
updated: 2026-09-26
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activesupport", "date"]
deps: ["time-zone-returns-zone-object-not-abbreviation"]
deps-rfc: []
est-loc: 120
priority: 51
pr: trails#8122
claim: "2026-09-26T00:47:01Z"
assignee: "datetime-civil-sub-minute-offset-loses-instant-on-cast"
blocked-by: null
closed-reason: null
---

## Context

Split from `naming-residue-burndown-activesupport-structural` by the LOC ceiling. One activesupport `burndown` naming row is in `time-with-zone.ts`:

- `toTime` `getlocal`: Rails' `:zone` arm is `getlocal(time_zone)` (`vendor/rails/activesupport/lib/active_support/time_with_zone.rb:493-501`), which passes the `ActiveSupport::TimeZone` object. trails passes `this.timeZone.tzinfo.identifier`, because `Time#getlocal` (`packages/date/src/time.ts`) takes only a UTC offset or a zone identifier string.

MRI's `getlocal(zone)` with a timezone object goes through `zone_localtime` (`vendor/ruby/time.c:4083`). That keeps the object as the Time's zone, so `Time#zone` answers it (`time.c:5020-5037`). trails' `Time` has one zone slot that holds an identifier. So this row depends on the zone-object seat that `time-zone-returns-zone-object-not-abbreviation` (0123) ports.

## Acceptance criteria

- [ ] `Time#getlocal` accepts a timezone object that answers `utcToLocal` / `localToUtc`, as `zone_localtime` does, and `TimeWithZone#toTime`'s `:zone` arm is `this.getlocal(this.timeZone)`.
- [ ] `pnpm parity:api:calls:args:report` shows no `time-with-zone.ts` `toTime` naming row.
