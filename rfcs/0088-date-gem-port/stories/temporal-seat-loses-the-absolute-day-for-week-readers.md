---
title: "temporal-seat-loses-the-absolute-day-for-week-readers"
status: ready
updated: 2026-08-18
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

## Decision (2026-08-18, RFC 0088 owner)

**The seat raises rather than answering a wrong day.** Temporal has no Julian
calendar — `@js-temporal/polyfill` rejects `calendar: "julian"` and CLDR ships
only `gregory`/`iso8601` — so a `PlainDate` cannot carry a Julian-side absolute
day at all. Rather than pick which of the two acceptance criteria to violate,
`Date#toDate` refuses the spelling.

This **generalizes an already-shipped precedent** rather than inventing one:
`date-to-date-seat-raises-on-julian-only-spellings` (PR #6272) already made the
seat raise `Date::Error "invalid date"` for a Julian-only civil spelling ISO
rejects outright (`Date.civil(1500, 2, 29)`). That raise fires today only when
`Temporal.PlainDate.from(..., { overflow: "reject" })` happens to throw. The
decision extends it to **every** day the receiver's `sg` puts on the Julian
side, so the seat is never silently wrong about a weekday or a yday.

## Converged shape

`plainDateFromJd` (`packages/date/src/date.ts:4641`) gains the Julian-side
guard, using the **same discriminator `cJdToCivil` already uses one line
later** — `jd < sg` (`date.ts:4107`):

```ts
function plainDateFromJd(jd: number | bigint, sg = DEFAULT_SG): Temporal.PlainDate {
  const [nth, rjd] = decodeJd(jd);
  if (nth !== 0n) throw new DateError("invalid date");
  if (rjd < sg) throw new DateError("invalid date"); // Julian side: no Temporal calendar can hold it
  const [y, m, d] = cJdToCivil(rjd, sg);
  ...
}
```

Verify the guard against `cJdToCivil`'s own test rather than a hand-derived
reform constant, so `GREGORIAN` (never Julian) and `JULIAN` (always Julian)
fall out of the same comparison.

Do NOT "fix" this by converging a `Temporal` return back to a Ruby-shaped one
wholesale — that reverses RFC 0088's headline decision
(`vendor/sources.ts:212-221`).

## Acceptance criteria

- [ ] `Date.commercial(-4712, 1, 1)`'s seat **raises** `Date::Error`
      `"invalid date"` under a reform setting that puts it on the Julian side,
      rather than answering a commercial triple that disagrees with MRI's
      `#cwyear` / `#cweek` / `#cwday`.
- [ ] `Date.ordinal(1900, -2, Date::JULIAN)`'s seat **raises** rather than
      answering a `#yday` that disagrees with MRI's.
- [ ] A Gregorian-side day is unaffected: `toDate()` still answers, and its
      `dayOfWeek` / `dayOfYear` still match MRI.
- [ ] `test_commercial` / `test_fractional` in `test-switch-hitter.test.ts`
      assert the raise for the Julian-side cases and the readers Ruby asserts
      for the Gregorian-side ones — neither stays on `toString`.
- [ ] RFC 0088's mapping table records that a Julian-side day has no Temporal
      seat, extending the row `date-to-date-seat-raises-on-julian-only-spellings`
      added.
- [ ] `pnpm parity:api:extra --package date` clean; no new baseline rows.
