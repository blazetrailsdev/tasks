---
title: "set_time_zone_without_conversion rebuilds the wall clock instead of calling Time.zone.local_to_utc"
status: ready
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `set_time_zone_without_conversion` is one line
(`activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:52-54`):

```ruby
def set_time_zone_without_conversion(value)
  ::Time.zone.local_to_utc(value).try(:in_time_zone) if value
end
```

trails re-derives it by hand
(`packages/activerecord/src/attribute-methods/time-zone-conversion.ts:198-228`):
it reads the wall clock off the value in `zoneForIsUtc(subtypeIsUtc)`, rebuilds
it through `zone.local(year, month, day, hour, minute, second, millisecond)`,
then re-adds the sub-millisecond remainder as a separate `TimeWithZone`
because `zone.local` only takes milliseconds. It also branches on the value
type where Rails has no branch at all.

Called out as out of scope during PR #7537's review. That PR had to add
`if (value instanceof RubyTime) value = value.toTime().toInstant();` at the top
purely to feed the new `::Time` cast result into this Instant-based logic — a
bridge that exists only because the body is not `local_to_utc`.

## Converged shape

`setTimeZoneWithoutConversion(value)` is
`value ? inTimeZone(timeZone().localToUtc(value)) : null` — one call to
`TimeZone#local_to_utc` and one to `in_time_zone`, with no type branching, no
wall-clock reconstruction, and no sub-millisecond fixup. The `RubyTime` bridge
line deletes itself, since `local_to_utc` takes whatever `acts_like?(:time)`
admits.

Depends on `TimeZone#local_to_utc` being ported and accepting a Ruby `::Time`
(`activesupport/lib/active_support/values/time_zone.rb`).

## Acceptance criteria

- [ ] `setTimeZoneWithoutConversion` is the two-call Rails body, with no
      `instanceof` branching and no millisecond/sub-millisecond split.
- [ ] The `value instanceof RubyTime` bridge line is gone.
- [ ] Multiparameter and `Temporal.PlainDateTime` assignment to a
      time-zone-aware attribute still preserves the wall clock — the existing
      cases in `multiparameter-attributes.test.ts` and
      `type/date-time.trails.test.ts` still pass.
