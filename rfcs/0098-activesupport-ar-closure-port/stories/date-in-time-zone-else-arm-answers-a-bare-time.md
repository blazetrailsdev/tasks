---
title: "Date#in_time_zone's else arm answers to_time, not a system-zone TimeWithZone"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6457
claim: "2026-08-13T03:56:51Z"
assignee: "call-args-ar-select-async-kwarg"
blocked-by: null
closed-reason: null
---

## Context

`Date#in_time_zone` (`activesupport/lib/active_support/core_ext/date_and_time/zones.rb:20-28`)
has two arms:

```ruby
def in_time_zone(zone = ::Time.zone)
  time_zone = ::Time.find_zone! zone
  time = acts_like?(:time) ? self : nil
  if time_zone
    time_with_zone(time, time_zone)
  else
    time || to_time          # <- the arm trails does not port
  end
end
```

`packages/activesupport/src/date-ext.ts:108-114` (landed by PR #6197) ports the
`if time_zone` arm faithfully but substitutes the `else` arm with
`timeWithZone(date, TimeZone.find(Temporal.Now.timeZoneId()))` — the same
instant, but wrapped in a `TimeWithZone` rather than answered as a bare `Time`.

The reason is at the call site: the five callers
(`ago`/`since`/`beginningOfDay`/`middleOfDay`/`endOfDay`,
`date/calculations.rb:55-87`) delegate `since` / `middle_of_day` / `end_of_day`
to whatever `in_time_zone` returns, and trails has no bare-`Time` receiver
carrying those — `time-ext.ts` is a free-function module over JS `Date`, not a
receiver. Returning the union `TimeWithZone | Date` would push a two-arm
dispatch into all five bodies, which Rails does not have.

## Converged shape

Give the `Time` arm a receiver whose surface matches `TimeWithZone`'s for these
three methods, so `inTimeZone` can return the Ruby union and each caller keeps
its single delegating expression — or establish that `TimeWithZone` in the
system zone IS trails' `to_time` and record that equivalence once, in
`time-ext.ts`/`time-with-zone.ts`, instead of at this call site.

Observable difference today: none for the five callers (same instant, same
components). The divergence is in the returned type, which a caller reading
`in_time_zone` directly can see.

## Acceptance criteria

- [ ] `inTimeZone`'s `else` arm answers `to_time`'s value under a receiver
      Rails devs read as a bare `Time`, or the equivalence is recorded once
      rather than per-call-site.
- [ ] The deviation note at `date-ext.ts:102-106` is deleted, not reworded.

## Sweep note (2026-08-12)

**Path corrected:** the body is now
`packages/activesupport/src/core-ext/date/calculations.ts:109-115` (moved from
`date-ext.ts` by PR #6286). The divergence is unchanged — `inTimeZone` is typed
`: TimeWithZone` and the `else` arm is still
`timeWithZone(date, TimeZone.find(Temporal.Now.timeZoneId())!)` where Rails
answers `time || to_time`.
