---
title: "toTime's sub-minute seat leaves add/since/equals/compare reading the shifted instant"
status: draft
updated: 2026-09-07
rfc: "0138-ruby-compat-residual-convergence"
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

`SubMinuteOffsetZonedDateTime` (`packages/date/src/time.ts:315-343`, added by
PR #7584) is the seat `Time#toTime` answers for a sub-minute `utc_offset`. A
Temporal offset time zone is minute precision, so it seats the wall clock on
the truncated zone (`of2str`, `date.ts:3946-3952`) with the residual seconds
folded into the instant handed to `super()`, and patches the instant-reading
surface back to the receiver's true instant: `epochNanoseconds`,
`epochMilliseconds`, `toInstant()` and `withTimeZone()`.

`Temporal.ZonedDateTime`'s remaining instant-reading methods read the internal
slot directly and so still operate on the shifted instant: `add`, `subtract`,
`since`, `until`, `equals`, `round`, `startOfDay`, and the static
`Temporal.ZonedDateTime.compare`. No in-repo caller reaches any of them through
`toTime()` today (`withTimeZone` was the only one, and #7584 patched it), so the
gap is latent rather than live.

MRI has no such split — `Time#to_time` answers a `Time` whose arithmetic and
comparison are exact at second resolution
(`ruby -rtime -e 'p Time.new("2013-09-04 03:00:00 -00:44:30").to_i'` is
`1378266270`, and `+ 1` moves it to `1378266271`).

## Converged shape

Every instant-reading member of the seat answers the receiver's true instant,
so a caller cannot get a silently-shifted result — either by overriding the
remaining members the way `withTimeZone` is overridden, or by a seat that does
not carry a fabricated instant at all.

## Acceptance criteria

- `toTime().add({ seconds: 1 }).epochNanoseconds` for a `-00:44:30` receiver is
  the receiver's instant plus one second, not the shifted instant's.
- `equals` and `Temporal.ZonedDateTime.compare` agree with `toInstant()`
  ordering for a sub-minute-offset receiver.
- Tests in `packages/date/src/time.trails.test.ts` cover both.
