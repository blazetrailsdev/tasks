---
title: "Time#getlocal / #atInstant truncate a sub-minute fixed offset through of2str"
status: draft
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced after trails#8122 merged.

`Time.#atInstant` (`packages/date/src/time.ts:480`) seats a numeric zone as
`instant.toZonedDateTimeISO(of2str(zone))`. `of2str` (`packages/date/src/date.ts`)
floors to `±HH:MM`, and the constructor copies `#utcOffsetMemo` from
`zoned.offsetNanoseconds`. A fixed offset that isn't a whole number of
minutes therefore loses its seconds everywhere `#atInstant` receives a number:
`getlocal(n)`, `Time.at(x, in: n)`, `#timeAdd` on a fixed-offset time, and
`#zoneLocaltime`, which seats an LMT zone object's offset as a number (e.g.
`TimeWithZone#toTime` in 1807 America/New_York).

Probe:

    ruby:   Time.utc(2020,1,1,12).getlocal(-17762) → utc_offset -17762, 07:03:58
    trails: Time.utc(2020,1,1,12).getlocal(-17762) → utcOffset -17760, 07:04:00

MRI keeps the exact offset: `time_getlocaltime` → `time_set_utc_offset` +
`time_fixoff` (`vendor/ruby/time.c:4244-4272`), and `validate_utc_offset` only
bounds the value to under ±86400.

The `Time.new(..., offset)` constructor path already avoids this: it computes the
instant as `plain.toZonedDateTime("UTC").toInstant().subtract(offset)` and keeps
`#utcOffsetMemo = utcOffset` (trails#7509).

## Converged shape

`#atInstant` seats a numeric zone the way the constructor does. `#utcOffsetMemo`
is the exact number, and `#plainMemo` is `instant + offset` read as UTC, so the
wall clock carries the seconds. Nothing is derived from an `of2str` zoned value.

## Acceptance criteria

- [ ] `Time.utc(2020,1,1,12).getlocal(-17762)` answers `utcOffset` -17762 and
      `hour/min/sec` 7/3/58, and `+ 1` keeps -17762 (matches `ruby`).
- [ ] `getlocal(tzobj)` for an LMT zone seats the exact offset.
