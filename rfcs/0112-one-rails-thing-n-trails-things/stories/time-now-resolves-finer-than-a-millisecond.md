---
title: "Give Time.now sub-millisecond resolution, as CLOCK_REALTIME has"
status: draft
updated: 2026-08-29
rfc: "0112-one-rails-thing-n-trails-things"
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

Ruby has one clock read, `Time.now`. trails has two — activesupport's `clock`
seat (`packages/activesupport/src/time-travel.ts`) and `@blazetrails/date`'s
`Time.now` (`packages/date/src/time.ts`) — and after PR #7218 they disagree on
resolution.

PR #7218 fixed a millisecond-resolution collision in activesupport's `clock`
seat, but left the same defect in `@blazetrails/date`'s `Time.now`.

`Temporal.Now.instant()` in `@js-temporal/polyfill@0.5.1` is `Date.now()`
scaled to nanoseconds plus a sub-millisecond term itself derived from
`Date.now() % 1e6`, so two reads inside one millisecond are all but always the
same instant. Measured over 1000 same-millisecond read pairs: 9 of 979
differed, and then only by 1 ns.

Ruby's `Time.now` reads `CLOCK_REALTIME` (`time.c`, `rb_time_now` →
`gettimeofday`/`clock_gettime`) at nanosecond resolution and does not collide.

Two `packages/date/src/time.ts` seats still read the polyfill clock directly:

- `time.ts:551` — `static now()` is `Time.#atInstant(Temporal.Now.instant(), inZone)`
- `time.ts:615` — `Time.new` with no `year` falls through to the same call

The consequence is the one #7218 hit: `Timestamp#_update_record`
(`vendor/rails/activerecord/lib/active_record/timestamp.rb:127-137`) writes
`current_time_from_proper_timezone` (`timestamp.rb:79-80`, `Time.now.utc` /
`Time.now`) into `updated_at`. A record created and updated inside one
millisecond keeps its `updated_at`, so `attribute_changed?` is false and the
column drops out of `saved_changes`. Any caller reading `Time.now` directly,
rather than through the activesupport `clock` seat, is still exposed.

This also becomes load-bearing for
[time-helpers-stub-date-and-datetime-clock](../../0098-activesupport-ar-closure-port/stories/time-helpers-stub-date-and-datetime-clock.md),
which retires the `clock` holder in favour of `Time.now`: that convergence must
not reintroduce the collision #7218 just removed.

## Converged shape

Give `packages/date/src/time.ts` the same sub-millisecond wall-clock read
activesupport now uses — `performance.timeOrigin + performance.now()` — behind a
module-local helper, and route both seats above through it.

The precision floor is a microsecond, not the nanosecond Ruby delivers: an
epoch millisecond is ~1.8e12, so a double runs out of integer precision before
`* 1e6`. That is a genuine JS language shortcoming (`process.hrtime.bigint()` is
out — no `process.*`), it matches the precision Rails' own `datetime` columns
default to, and it is far finer than the collisions at issue. Record it at the
call site, as `systemEpochNs` in `packages/activesupport/src/time-travel.ts`
does.

## Acceptance criteria

- [ ] `Time.now()` and no-arg `Time.new()` resolve finer than a millisecond:
      of same-millisecond read pairs, a majority return distinct instants.
- [ ] A regression test pins it and fails against the `Temporal.Now.instant()`
      baseline (the activesupport twin measures 19 distinct of ~950 pairs on
      baseline versus all pairs on the fix).
- [ ] The microsecond floor is justified at the call site.
- [ ] `packages/date` suite green, including the DST fall-back and `inZone`
      cases in `time.trails.test.ts`.
- [ ] No observable change to zone, offset, or the value `Time.at` /
      `Time.utc` / `Time.mktime` answer.
