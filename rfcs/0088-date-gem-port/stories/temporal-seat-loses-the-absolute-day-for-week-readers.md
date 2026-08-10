---
title: "temporal-seat-loses-the-absolute-day-for-week-readers"
status: ready
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Date.commercial` / `Date.jd` / `Date.ordinal` answer a `Temporal.PlainDate`
built by `Date#toDate()`, which renders the receiver's CIVIL triple into a
`PlainDate` in the ISO calendar. That throws away the absolute day, and every
Temporal reader derived from the weekday is then computed from the ISO reading
of a triple that may have come off the Julian calendar.

Concretely, on the merged PR #6317 branch:

```ruby
Date.commercial(-4712, 1, 1)   # cwday 1 in Ruby
  .dayOfWeek                   # => 4
```

`c_valid_commercial_p` / `c_jd_to_commercial` (`vendor/date/ext/date/date_core.c`)
compute the commercial triple from the Julian day, so MRI's `#cwday` is 1 by
construction. Temporal's `dayOfWeek` is `(isoDate) mod 7` over the _rendered_
`-4712-01-01`, which is a different absolute day whenever the receiver's `sg`
put it on the Julian side of the reform.

`#dayOfYear` happens to agree for the cases `test_switch_hitter.rb` exercises,
but only because ISO and Julian leap rules coincide in those years — it has the
same defect in a year they disagree on (1900 under `Date::JULIAN`).

This is why `test_commercial` and `test_fractional` in
`packages/date/src/test-switch-hitter.test.ts` assert through the seat's
`toString` rather than through `yearOfWeek` / `weekOfYear` / `dayOfWeek`:
asserting the seat's values would have enshrined the wrong weekday.

## Converged shape

The seat has to carry the absolute day, not just the civil triple, so a caller
reading a week or weekday reader off it gets `c_jd_to_commercial`'s answer.
Options, cheapest first:

- Have `toDate()` render into the calendar the receiver's `sg` actually names,
  so the ISO reading of the result is the same absolute day MRI has.
- Answer the gem-shaped `Date` for the spellings whose readers have no faithful
  seat counterpart, per the RFC's Ruby opt-in
  (`date-temporal-default-return-and-ruby-opt-in`).

Do NOT "fix" this by converging a `Temporal` return back to a Ruby-shaped one
wholesale — that reverses RFC 0088's headline decision
(`vendor/sources.ts:212-221`).

## Acceptance criteria

- [ ] `Date.commercial(-4712, 1, 1)`'s seat answers the commercial triple MRI's
      `#cwyear` / `#cweek` / `#cwday` answer, for both reform settings.
- [ ] `Date.ordinal(1900, -2, Date::JULIAN)`'s seat answers MRI's `#yday`.
- [ ] `test_commercial` / `test_fractional` in `test-switch-hitter.test.ts` are
      moved back onto the readers Ruby asserts, off `toString`.
