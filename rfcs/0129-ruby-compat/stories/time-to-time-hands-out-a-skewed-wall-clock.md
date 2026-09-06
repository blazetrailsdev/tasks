---
title: "Time#toTime's ZonedDateTime wall clock is up to 59s off for a sub-minute utc_offset"
status: ready
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Time#toTime` (`packages/date/src/time.ts:1064`) is

```ts
return this.#instant.toZonedDateTimeISO(this.#timeZoneId ?? of2str(this.#utcOffset));
```

PR #7530 (story `time-to-time-truncates-a-sub-minute-offset`) established that
the **instant** is exact for a sub-minute offset — #7509's constructor fix made
`#instant` precise, and #7530 pinned it with a falsifiable regression test.

The **wall clock** is still wrong. `of2str` (`packages/date/src/date.ts:3946-3952`,
the port of Ruby's `of2str`) renders an offset as `±HH:MM`, so
`Time.new("2013-09-04 03:00:00 -00:44:30").toTime()` is

```console
2013-09-04T03:00:30-00:44[-00:44]
```

— the instant is right (`1378266270`), but the local time reads `03:00:30`
where MRI reads `03:00:00`. `#plain`, and therefore `hour`/`min`/`sec`/`toS`,
are all correct; only the `ZonedDateTime` `toTime` hands out is skewed.

This reaches callers. `toTime().toPlainDateTime()` is how
`connection-adapters/sqlite3/quoting.ts:87` and
`connection-adapters/abstract/quoting.ts:280` turn a `RubyTime` into a quoted
timestamp, so a sub-minute-offset `Time` quotes 30s off.
`activesupport/src/time-with-zone.ts:148,199,251` read the same path.

## Why it was not fixed in #7530

Temporal offset time-zone identifiers are **minute precision**, verified on
`@js-temporal/polyfill`:

```console
Temporal.Instant#toZonedDateTimeISO("-00:44:30")
  -> RangeError: Seconds not allowed in offset time zone: -00:44:30
```

So one `ZonedDateTime` cannot carry both the exact instant and the exact wall
clock. #7530's acceptance criteria named the instant explicitly
(`toTime().epochNanoseconds` must equal the receiver's own instant), so the
instant was kept and the wall clock left alone rather than traded against a
stated criterion. Both halves are correct in MRI, so this is a real gap, not a
settled deviation.

## Converged shape

`toTime()` answers a value whose wall clock AND instant both match MRI for a
sub-minute `utc_offset`. Since one `ZonedDateTime` provably cannot, the seat has
to change — the options seen so far, none yet chosen:

- Return the gem-shaped object rather than a `ZonedDateTime` for the sub-minute
  case, the way `date-temporal-default-return-and-ruby-opt-in` weighs the same
  trade for `DateTime.parse` (RFC 0088 story, lines 119-121).
- Carry the residual seconds beside a minute-rounded zone and have the readers
  that need wall clock apply it.

This is the same Temporal minute-precision constraint
`datetime-seat-truncates-a-sub-minute-offset` records for the DateTime seat;
that story is about `date_zone_to_diff`'s seat, this one about `Time#toTime`'s
return, so they converge separately but should pick a consistent answer.

## Acceptance criteria

- [ ] `Time.new("2013-09-04 03:00:00 -00:44:30").toTime()` reports a wall clock
      of `03:00:00`, matching MRI.
- [ ] `toTime().epochNanoseconds` still equals the receiver's own instant
      (`toI()` of `1378266270`) — the guarantee #7530 pinned must not regress.
- [ ] `utcOffset` keeps reporting the exact second-resolution offset.
- [ ] The `toTime().toPlainDateTime()` callers in `sqlite3/quoting.ts:87`,
      `abstract/quoting.ts:280` and `time-with-zone.ts:148,199,251` quote the
      MRI wall clock for a sub-minute-offset receiver.
- [ ] The date suite and all three adapter lanes stay green.
