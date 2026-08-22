---
title: "TimeZone#at truncates sub-millisecond precision Time.at preserves"
status: ready
updated: 2026-08-22
rfc: "0098-activesupport-ar-closure-port"
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

`TimeZone#at` (`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:378-380`) is

```ruby
def at(*args)
  Time.at(*args).utc.in_time_zone(self)
end
```

`Time.at` takes a second argument for sub-second resolution
(`Time.at(946684800, 123456.789).nsec # => 123456789`, quoted in that method's
own docstring at `:371-375`) and accepts a `Rational` first argument.

trails' `at` (`packages/activesupport/src/values/time-zone.ts`, `at(secondsSinceEpoch: number)`)
is `Temporal.Instant.fromEpochMilliseconds(Math.trunc(secondsSinceEpoch * 1000))`
— one argument, and everything below the millisecond is truncated away.

PR #6848 made this reachable from a new caller: `partsToTime`'s `parts[:seconds]`
arm (`time_zone.rb:589-590`, `Time.at(parts[:seconds])`) routes through `at`,
because Ruby's `Time.at(...)` plus the shared
`if parts[:offset] || parts[:seconds] then TimeWithZone.new(time.utc, self)`
wrap (`:602-606`) reduces to exactly `#at`'s body. `Date._strptime`'s `%s` is a
`bigint` and its `%Q` a `Rational` (`packages/date/src/date.ts`, `DateParts.seconds`),
so a `%Q`-parsed millisecond value already loses precision through this arm
today.

The rest of the file no longer truncates: `partsToTime`'s non-`:seconds` arms
carry `sec_fraction` down to the nanosecond through `Temporal.PlainDateTime`.
`at` is now the only sub-second floor left on the `parse`/`strptime` path.

## Converged shape

`at` takes Rails' `*args` — at minimum the `(seconds, subsecondMicros)` pair
`Time.at` accepts, and a `Rational`/`bigint` first argument — and builds the
instant with `Temporal.Instant.fromEpochNanoseconds` so no digit is dropped.
`@blazetrails/date` has no `Time.at` (`packages/date/src/time.ts` exposes
`now`/`utc`/`mktime` only); adding it there and delegating is the fuller
convergence, and is the gap `time-helpers-stub-date-and-datetime-clock`
records.

## Acceptance criteria

- [ ] `TimeZone#at` accepts Rails' argument forms and preserves nanosecond
      resolution rather than truncating at the millisecond.
- [ ] A test drives `zone.strptime` with a `%Q`/`%s` format whose value carries
      sub-millisecond digits and asserts they survive.
- [ ] Existing `TimeZone#at` / `partsToTime` callers stay green on all three
      adapter lanes.
