---
title: "TimeZone[] must return nil for an unmatched name or offset, not raise"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6234
claim: "2026-08-08T14:04:11Z"
assignee: "attribute-moved-extras-to-their-rails-owner"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::TimeZone.[]` returns `nil` for a name it cannot resolve and for
a Numeric/Duration offset no zone matches
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:232-250` —
the `rescue TZInfo::InvalidTimezoneIdentifier; nil` arm at `:239-241` and the
`all.find { ... }` at `:246`, which is `nil` when nothing matches). It raises
only for an argument of the wrong class (`:249`).

trails' port of `[]` is `TimeZone.find`
(`packages/activesupport/src/values/time-zone.ts`), which **throws** in both
cases. Because of that, `findZoneBang` (`time-zone-config.ts`) cannot delegate
the argument-class arm: it keeps its own
`invalid argument to TimeZone[]` raise so that each of Rails' two messages is
still produced for its own case, instead of doing what `zones.rb:83` does —

```ruby
ActiveSupport::TimeZone[time_zone] || raise(ArgumentError, "Invalid Timezone: #{time_zone}")
```

Surfaced by PR #6232, which moved the Numeric/Duration arm into `find` and
documented this at the call site (JSDoc on `TimeZone.find` and `findZoneBang`).

## Converged shape

- `TimeZone.find` returns `TimeZone | null`: `null` for an unmatched name and
  for an unmatched offset, throwing only the
  `invalid argument to TimeZone[]` ArgumentError (`time_zone.rb:249`, whose
  message interpolates the argument's `inspect`).
- `findZoneBang` becomes the single line `zones.rb:83` is: call `[]`, raise
  `Invalid Timezone: #{time_zone}` on a nullish result. Its argument-class arm
  disappears.
- The ~60 call sites that treat `find` as infallible (`TimeZone.find(x).local(...)`
  and friends across activesupport/activerecord/activemodel) take the nullish
  result. Most are in tests with a literal zone name; a `!` or an explicit raise
  at the call site is fine there.

Sizeable mostly because of the call-site sweep, not the logic.

## Acceptance criteria

- `TimeZone.find` returns `null` (never throws) for an unresolvable name or an
  unmatched Numeric/Duration offset.
- `findZoneBang` contains no argument-class arm; it is `[]` + the `zones.rb:88`
  raise.
- `Time.find_zone!(Object.new)` still reports `invalid argument to TimeZone[]`
  and `Time.find_zone!("NOT-A-TIMEZONE")` still reports
  `Invalid Timezone: NOT-A-TIMEZONE`.
- `time-zone.test.ts` and `core-ext/time-with-zone.test.ts` stay green.
