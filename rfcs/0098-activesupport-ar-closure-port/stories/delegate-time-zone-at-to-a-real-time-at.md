---
title: "TimeZone#at scales nanoseconds itself where Rails delegates to Time.at"
status: in-progress
updated: 2026-08-22
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6861
claim: "2026-08-22T16:05:06Z"
assignee: "aggregate-reflections-plain-hash-for-merge"
blocked-by: null
closed-reason: null
---

## Context

Surfaced landing PR #6859 (`time-zone-at-truncates-sub-millisecond-precision`).

`TimeZone#at` (`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:378-380`) is

    def at(*args)
      Time.at(*args).utc.in_time_zone(self)
    end

so the whole body is `Time.at` plus `in_time_zone`. `@blazetrails/date` has no
`Time.at` (`packages/date/src/time.ts` exposes `now` / `utc` / `mktime` only),
so PR #6859 built the instant inside `time-zone.ts` instead, through a private
`toNanoseconds(value, scale)` helper
(`packages/activesupport/src/values/time-zone.ts`) that scales an Integer,
Float or Rational argument to a whole `bigint` count of nanoseconds. It carries
a `@noRailsEquivalent CONVERGEABLE` tag: Rails' `at` has no such helper because
Ruby's Numeric tower does the arithmetic exactly and `Time.at` absorbs the
argument coercion.

The argument-coercion rules the helper reproduces are `Time.at`'s, not
`TimeZone#at`'s — including the Float truncation MRI shows as
`Time.at(946684800.123456789).nsec # => 123456835`.

## Converged shape

- Add `Time.at(seconds, microsecondsWithFrac = 0)` to `packages/date/src/time.ts`,
  taking Ruby's Integer / Float / Rational argument forms and carrying the
  result to the nanosecond.
- `TimeZone#at` becomes the one-line mirror of `time_zone.rb:378-380` — build
  the `Time`, take its instant, wrap it in a `TimeWithZone` for `self`.
- Delete `toNanoseconds` and its `@noRailsEquivalent` tag from
  `packages/activesupport/src/values/time-zone.ts`.

Related: `time-helpers-stub-date-and-datetime-clock` records the same missing
`Time` surface from the time-helpers side.

## Acceptance criteria

- [ ] `@blazetrails/date` exposes `Time.at` with Ruby's argument forms.
- [ ] `TimeZone#at` delegates to it and carries no bespoke scaling helper.
- [ ] `pnpm parity:api:extra --package activesupport` shows no new novel surface;
      the `toNanoseconds` `@noRailsEquivalent` tag is gone.
- [ ] `time-zone.test.ts` `at` / `at with microseconds` / `at with old date` and
      the `%Q` strptime sub-millisecond case stay green.
