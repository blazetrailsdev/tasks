---
title: "DateAndTime::Calculations past?/future?/before?/after? compare a Time by date, not instant"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`DateAndTime::Calculations#past?` / `#future?` / `#before?` / `#after?`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`)
are `self < self.class.current`, `self > ...`, and `self < date_or_time`. For a
`Time` receiver, Ruby resolves `self.class.current` to `Time.current` and `<`
to `Time#<=>`, so the whole instant is compared.

In `packages/activesupport/src/core-ext/date-and-time/calculations.ts`, the
module is mixed onto `RubyTime.prototype` (`include(RubyTime, ...)`, bottom of
file), but two private dispatchers have no `RubyTime` arm:

- `classCurrent` falls through to `date.current()` (a Date) for a `RubyTime`,

  because its only Time check is `this instanceof Date` (a JS `Date`).

- `toInstant` falls through to `toDate.call(dateOrTime).toZonedDateTime("UTC")`,

  which drops the time of day.

So `time.isPast()` / `time.isFuture()` / `time.isBefore(x)` /
`time.isAfter(x)` on a `Time` compare calendar dates at UTC midnight instead of
instants. trails#8070 added `RubyTime` arms to the other private dispatchers
(`change`, `hour`..`nsec`, `wday`/`year`/`month`/`day`, `midnight`,
`beginning_of_day` / `end_of_day`) but not these two.

## Converged shape

`classCurrent` answers `Time.current` (`core_ext/time/calculations.rb`
`Time.current`, trails `current()` in `core-ext/time/calculations.ts`) for a
`RubyTime` receiver. `compare` / `toInstant` compare a `RubyTime` by its instant
(`toTime().toInstant()`), the way `Time#<=>` does.

## Acceptance criteria

- `Time.utc(y, m, d, 23, 0, 0)` for today reads as `past?` / `future?`

  against the current instant, not against today's date.

- `time.isBefore(other)` / `isAfter` distinguish two `Time`s on the same date.

- A test pins both and fails on today's baseline; the Date / PlainDate arms are

  unchanged.
