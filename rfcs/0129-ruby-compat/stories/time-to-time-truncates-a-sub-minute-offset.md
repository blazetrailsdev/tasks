---
title: "Time#toTime truncates a sub-minute utc_offset through of2str"
status: draft
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Time#toTime` (`packages/date/src/time.ts:1026`) builds its `ZonedDateTime`
through `this.#timeZoneId ?? of2str(this.#utcOffset)`, and `of2str`
(`packages/date/src/date.ts:3946-3952`, the port of Ruby's `of2str`) renders an
offset as `±HH:MM` only — the seconds are floored away. So a `Time` carrying a
sub-minute `utc_offset` reports the right `utcOffset` (`-2670` for
`-00:44:30`) and then hands out a `ZonedDateTime` that is up to 59s off.

PR #7509 fixed the same truncation in the constructor
(`time.ts:927-935`, which now computes the instant as
`plain.toZonedDateTime("UTC").toInstant().subtract(offset)` rather than through
`of2str`), because `fast_string_to_time`
(`activemodel/lib/active_model/type/helpers/time_value.rb:76-98`) parses
`"2013-09-04 03:00:00 -00:44:30"` through `Time.new` and lost the 30s.
`toTime` was left on the old path — it was not on that PR's road.

MRI keeps the seconds: `Time.new("2013-09-04 03:00:00 -00:44:30")` prints
`-004430` and its `to_i` is `1378266270`, not `1378266240`.

## Converged shape

`toTime` returns a `ZonedDateTime` whose instant matches `#instant` exactly for
a sub-minute offset. Temporal's offset time-zone identifiers are minute
precision, so the seat has to come off `of2str` the way the constructor did —
either by shifting the instant, or by carrying the exact offset alongside a
minute-rounded zone.

## Acceptance criteria

- `Time.new("2013-09-04 03:00:00 -00:44:30").toTime().epochNanoseconds`
  equals the receiver's own instant (`toI()` of `1378266270`).
- `utcOffset` keeps reporting the exact second-resolution offset.
- The date suite stays green.
