---
title: "convert-time-to-time-zone-guard-is-an-instanceof-list"
status: done
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7534
claim: "2026-09-05T20:46:47Z"
assignee: "convert-time-to-time-zone-guard-is-an-instanceof-list"
blocked-by: null
closed-reason: null
---

## Context

`TimeZoneConverter#convert_time_to_time_zone`
(`activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:40-49`)
guards on `value.acts_like?(:time)` and answers `value.in_time_zone`:

```ruby
def convert_time_to_time_zone(value)
  return if value.nil?

  if value.acts_like?(:time)
    value.in_time_zone
  elsif value.respond_to?(:infinite?) && value.infinite?
    value
  else
    map(value) { |v| convert_time_to_time_zone(v) }
  end
end
```

`packages/activerecord/src/attribute-methods/time-zone-conversion.ts`'s
`convertTimeToTimeZone` replaces that guard with a hardcoded `instanceof` list
— `TimeWithZone`, `Temporal.Instant`, and (as of PR #7512) `Time` — and
reconstructs the `TimeWithZone` inline instead of sending `in_time_zone`.

`Object.actsLike(value, "time")`
(`packages/activesupport/src/core-ext/object/acts-like.ts:5-8`) is ported, and
so is `in_time_zone` for a Ruby `Time` / `Date` / `Temporal.Instant`
(`packages/activesupport/src/core-ext/date-and-time/zones.ts:12-30`, the port of
`activesupport/lib/active_support/core_ext/date_and_time/zones.rb`). The list
therefore admits `Temporal.PlainDateTime` and `Temporal.ZonedDateTime` nowhere
even though `actsLikeTime` answers true for both
(`packages/date/src/acts-like.ts:13-21`), and every new time representation has
to be remembered here by hand — PR #7512 had to add `Time` to it for exactly
that reason.

Converging needs two things: the guard becomes
`ActsLikeObject.actsLike(value, "time")`, and `in_time_zone` grows the
`TimeWithZone` / `PlainDateTime` / `ZonedDateTime` arms it is missing so the
send is total over the guard's domain. `inTimeZone` from
`core-ext/date-and-time/zones.ts` is not exported from activesupport's index
today (the index's `inTimeZone` is `core-ext/string/zones.ts`'s), so the export
naming has to be settled as part of this.

## Acceptance criteria

- [ ] `convertTimeToTimeZone`'s guard is `acts_like?(:time)`, not an
      `instanceof` list.
- [ ] The body sends the ported `in_time_zone` rather than constructing a
      `TimeWithZone` inline.
- [ ] `in_time_zone` covers every value `actsLike(_, "time")` admits.
- [ ] No test renames.
