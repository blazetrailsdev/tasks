---
title: "temporal-seat-loses-the-absolute-day-for-week-readers"
status: ready
updated: 2026-08-19
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

## Decision (2026-08-18, RFC 0088 owner) — supersedes the 2026-08-18 raise

**Answer the gem-shaped `Date` for the spellings Temporal cannot represent.**
`toDate()` returns a `Temporal.PlainDate` for a Gregorian-side day and the
Ruby-shaped `Date` itself for a Julian-side one. This is option 2 of this
story's original `## Converged shape`, and it is the RFC's own documented Ruby
opt-in (`date-temporal-default-return-and-ruby-opt-in`, PR #6264).

### Why the earlier raise decision was withdrawn

The first ruling was "raise `Date::Error` for any day the receiver's `sg` puts
on the Julian side", generalizing `date-to-date-seat-raises-on-julian-only-spellings`
(PR #6272). Implemented as `if (rjd < sg) throw` in `plainDateFromJd`, it **reds
30 ported gem tests across 6 files** — because `Date.jd()` / `Date.ordinal()` /
`Date.commercial()` all default to jd 0 = `-4712-01-01`, which is Julian-side
under the default `ITALY` reform (`date.ts:3851`, `ITALY = 2299161`). It is the
BASE CASE of `test-date-new`, `test-date-parse`, `test-date-strptime`,
`test-date-conv` and `date.trails.test`, not an exotic spelling. Converting
those to `expect().toThrow()` would drop their MRI-matching assertions and take
`parity:test` assertion deltas negative — a hard gate.

The narrower raise from #6272 stands: a Julian-only CIVIL spelling ISO rejects
outright (`Date.civil(1500, 2, 29)`) still raises. This decision governs the
much larger set of days that ISO _can_ spell but reads on the wrong absolute day.

### Not a reversal of the headline decision

This story's own `## Converged shape` forbids converging a Temporal return back
to a Ruby-shaped one **wholesale** — that would reverse RFC 0088's headline
commitment (`vendor/sources.ts:212-221`). This is not wholesale: it is the
provable subset Temporal has no calendar for. Gregorian-side days — every date
a normal caller constructs — are unaffected and still answer `Temporal`.

## Converged shape

The Ruby-shaped object **already exists at the conversion site**, so this is a
narrow change, not a re-architecture. `Date.jd` (`date.ts:6599-6604`):

```ts
const ret = new Date(SEAT, nth, rjd, val2sg(start));
return addFracTo(ret, fr2).toDate(); // <- the only conversion
```

Widen the seat and let the statics inherit it:

```ts
toDate(): Temporal.PlainDate | Date {
  const [nth, rjd] = decodeJd(encodeJd(this.nth, this.mLocalJd()));
  if (rjd < this.sg) return this;   // Julian side: carries jd, so cwday/yday are MRI's
  return plainDateFromJd(encodeJd(this.nth, this.mLocalJd()), this.sg);
}
```

`Date.jd` / `ordinal` / `civil` / `commercial` (`:6599`, `:6613`, `:6639`,
`:6656`) and the `DateTime` statics all end in `.toDate()`, so they inherit the
union with no other edit. Use the same `jd < sg` test `cJdToCivil` uses
(`date.ts:4107`) rather than a hand-derived constant.

### The 30 tests should need no churn — verify, don't assume

The readers those tests use exist on **both** shapes:

- `test-date-new.test.ts:19` defines `ymd` structurally as
  `{ year: number; month: number; day: number }`. The gem-shaped `Date` carries
  `year` (`:7034`), `mon` (`:7042`), `month` (`:7046`), `day` (`:7050`) and
  `mday` (`:7060`) — Ruby's `mon`/`month` aliases are both ported.
- `equals` exists on the gem-shaped `Date` (`:5770`), which is what
  `d.equals(d2)` needs.
- Precedent that the union is already an anticipated shape:
  `date.trails.test.ts:33`'s `ymd` helper is typed
  `RubyDate | Temporal.PlainDate` and branches `date instanceof RubyDate`.

One known friction: `Date#year` returns `number | bigint` while
`Temporal.PlainDate#year` returns `number`, so the structural helper's type may
need widening even though the runtime values match. Fix the type, not the test's
assertions.

## Acceptance criteria

- [ ] `toDate()` returns `Temporal.PlainDate | Date` — the gem-shaped receiver
      for a Julian-side day, `Temporal.PlainDate` otherwise — using the same
      `jd < sg` discriminator `cJdToCivil` uses.
- [ ] `Date.commercial(-4712, 1, 1)`'s value answers the commercial triple MRI's
      `#cwyear` / `#cweek` / `#cwday` answer, for both reform settings.
- [ ] `Date.ordinal(1900, -2, Date::JULIAN)`'s value answers MRI's `#yday`.
- [ ] A Gregorian-side day still answers `Temporal.PlainDate`, and its
      `dayOfWeek` / `dayOfYear` still match MRI.
- [ ] `test_commercial` / `test_fractional` in `test-switch-hitter.test.ts` move
      back onto the readers Ruby asserts, off `toString`.
- [ ] **`parity:test` for `date` stays at 137/137 (100%, measured 2026-08-18 on
      `dcffeff21`) and its assertion deltas are non-negative.** No test converts
      to `expect().toThrow()` to accommodate this change.
- [ ] The #6272 raise still fires for a Julian-only civil spelling ISO rejects
      (`Date.civil(1500, 2, 29)`); this change does not widen or narrow it.
- [ ] RFC 0088's mapping table records which spellings answer the gem-shaped
      `Date`, extending the row #6272 added.
- [ ] `pnpm parity:api:extra --package date` clean; no new baseline rows.
