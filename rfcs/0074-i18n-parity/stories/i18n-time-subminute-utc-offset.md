---
title: "Time.new: accept MRI's sub-minute utc_offset (~120 LOC)"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6074
claim: "2026-08-04T17:15:00Z"
assignee: "i18n-time-subminute-utc-offset"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/time.ts`'s `utcOffsetArgument` raises `ArgumentError` for a
sub-minute `utc_offset` — `new Time(2008, 3, 1, 6, 0, 0, "+09:00:30")` and the
numeric `32430` both raise — where MRI accepts them:

```ruby
Time.new(2008, 3, 1, 6, 0, 0, "+09:00:30").utc_offset  # => 32430
```

The blocker is the representation: `Time` holds a
`Temporal.ZonedDateTime`, and a Temporal offset time zone is minute-precision
(`Seconds not allowed in offset time zone: +09:00:30`). The raise is a
deviation recorded at the call site in `utcOffsetArgument`'s JSDoc, filed here
rather than left as prose.

Rails anchor: the callers that reach core `Time.new` with an offset are
`activesupport/lib/active_support/core_ext/string/conversions.rb:28-35`
(`parts.fetch(:offset, ...)`, from `Date._parse`) and
`core_ext/time/calculations.rb:172-175` (`utc_offset`) — both whole minutes,
which is why nothing in Rails trips this today.

## Converged shape

Carry the offset as a value trails controls rather than as a Temporal time
zone id — keep the `PlainDateTime` plus an offset in seconds and derive
`utcOffset` / `%z` / `zone` from it — so every `utc_offset` MRI accepts is
representable, and drop the raise. `%z` stays `±HHMM` (MRI truncates the
seconds there); `utc_offset` answers the full second count.

## Acceptance criteria

- `new Time(y, m, d, h, mi, s, "+09:00:30")` and the numeric equivalent build a
  time whose `utcOffset` is `32430`.
- No `ArgumentError` arm for a whole-second offset; the MRI message stays for
  the spellings MRI itself rejects.
- The deviation note in `utcOffsetArgument`'s JSDoc is deleted.
