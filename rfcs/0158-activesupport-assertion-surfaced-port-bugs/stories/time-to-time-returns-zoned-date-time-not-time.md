---
title: "Time#toTime returns a Temporal.ZonedDateTime where Ruby's Time#to_time returns a Time"
status: draft
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8058 (story `date-in-time-zone-return-type-includes-time`).

Ruby's `Time#to_time` returns the Time itself. MRI's date extension defines it
as `return self;` (`vendor/ruby/ext/date/date_core.c:8883-8887`), and
ActiveSupport overrides it as `preserve_timezone ? self : getlocal`
(`vendor/rails/activesupport/lib/active_support/core_ext/time/compatibility.rb:13-15`).
Either way the result is a `Time`.

trails' `Time#toTime` (`packages/date/src/time.ts`, `toTime(): Temporal.ZonedDateTime`)
converts the Time to a `Temporal.ZonedDateTime` instead. That is a Temporal
conversion carrying the Ruby method's name, not a port of it. The AS override
exists separately as the free function `toTime(time)` in
`packages/activesupport/src/core-ext/time/compatibility.ts`, so the same Ruby
method has two TS spellings that return different types.

The cost showed up in #8058. Once `Date#in_time_zone` / `Date#midnight` were
typed `TimeWithZone | Time`, `travelTo`
(`packages/activesupport/src/testing/time-helpers.ts`, Rails'
`date_or_time.midnight.to_time`) could not just call `.toTime()`. For the Time
arm that would return a `ZonedDateTime`. It has to dispatch:

```ts
now = dateMidnight instanceof Time ? toTime(dateMidnight) : dateMidnight.toTime();
```

`TimeWithZone#toTime` returns a `Time` (`time-with-zone.ts`), so trails'
`Time#toTime` is the odd one out.

## Converged shape

`Time#toTime()` returns `Time`: `this` for the MRI method, with AS's
`preserveTimezone() ? this : this.getlocal()` arm carried by the
`compatibility.ts` port, the way AS reopens `Time`. The Temporal conversion
moves to a name that says so (e.g. `toZonedDateTime`, which already exists on
the Temporal side). `travelTo`'s dispatch then collapses to `midnight(...).toTime()`,
as in Rails.

There are about 250 `.toTime()` call sites across `packages/`. Many are on
`TimeWithZone` or `Date`, and the Time ones that want a `ZonedDateTime` need
auditing, so this may need splitting by package.

## Acceptance criteria

- [ ] `@blazetrails/date` `Time#toTime` returns a `Time`, matching
      `date_core.c:8883-8887` + `compatibility.rb:13-15`.
- [ ] Callers that wanted the Temporal value use the renamed conversion.
- [ ] `travelTo` calls `midnight(dateOrTime).toTime()` with no `instanceof` dispatch.
- [ ] `pnpm typecheck`, `parity:api:calls`, `parity:api:calls:args` green.
