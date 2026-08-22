---
title: "Time carries no instant, so Time.at round-trips through the local wall clock"
status: ready
updated: 2026-08-22
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `Time` carries no instant, so `Time.at` round-trips through the local wall clock

## Context

Landed with PR #6861 (`delegate-time-zone-at-to-a-real-time-at`).

`packages/date/src/time.ts` holds a `Temporal.PlainDateTime` plus a zone id and
an offset — never the epoch. So `Time.at` (`time.c` `time_s_at`) computes the
exact nanosecond instant, converts it to a local `Temporal.ZonedDateTime`, and
then hands the wall-clock components to the public constructor, which
re-derives the offset from that wall clock via `toZonedDateTime` (default
`compatible` disambiguation, `time.ts:445-448`).

MRI's `::Time` holds the epoch (`time.c` `time_new_timew`), so `Time.at` there
is lossless by construction. Ours is lossless only where the local wall clock
names one instant: during the repeated hour after a DST fall-back the round
trip picks the earlier offset, so `Time.at(t)` can answer an instant one hour
from `t`. `Time.now` shares the shape, and `TimeZone#at`
(`time_zone.rb:378-380`) inherits it through its `Time.at(...).getutc()`
delegation.

Not observable on the SQLite/PG/MySQL lanes, which run with `TZ=UTC`.

## Converged shape

Give `Time` the instant MRI's holds — a private `Temporal.Instant` seat (or an
internal instant-taking construction path) that `Time.at` / `Time.now` set
directly, with `#plain` derived from it rather than the reverse. `utcOffset`
then reads the offset at that instant instead of re-deriving it from a
wall clock that may name two.

## Acceptance criteria

- [ ] `Time.at(epochSeconds)` answers that exact instant under every `TZ`,
      including an instant inside a DST fall-back's repeated hour.
- [ ] `TimeZone#at` and `Time.now` inherit the fix; no new `@noRailsEquivalent`.
- [ ] A trails test pins the ambiguous-hour instant under a fixed `TZ`.
