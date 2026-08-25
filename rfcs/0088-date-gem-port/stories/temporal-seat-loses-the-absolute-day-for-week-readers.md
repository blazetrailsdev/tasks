---
title: "temporal-seat-loses-the-absolute-day-for-week-readers"
status: done
updated: 2026-08-19
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: 6735
claim: "2026-08-19T11:35:05Z"
assignee: "wave-4c-ar-core-residue-model-c"
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

## Decision (2026-08-18, RFC 0088 owner) — FINAL

**Keep the civil spelling. No new error. The divergence is accepted and
recorded, not converged.**

`toDate()` continues to render the receiver's civil triple into a
`Temporal.PlainDate`. For a Julian-side day the readers Temporal derives from
the absolute day — `dayOfWeek`, `dayOfYear`, and the commercial triple — stay
unfaithful to MRI. That is a known, documented limitation of the seat.

### Why this is ratifiable when almost nothing is

CLAUDE.md admits a deviation only for a genuine TypeScript/runtime shortcoming,
after the settled workaround has been tried. Both conditions hold, and the
proof is mechanical rather than a preference:

- **Temporal has no Julian calendar.** `@js-temporal/polyfill` rejects
  `calendar: "julian"`; CLDR ships `gregory` and `iso8601` only. So every
  `PlainDate` reads as exactly one absolute day.
- **The two correct answers are mutually exclusive.** A seat for a Julian-side
  day can carry the civil triple MRI spells OR the absolute day MRI computes
  weekday/yday from, never both. This is proved in the `blocked-by` history of
  this story.
- **Ruby has no counterpart decision to port.** `Date#to_date` returns `self`;
  the gem never renders into a second calendar system. There is no Rails answer
  being deviated from — this is a seam trails invents because Temporal exists.

### Two alternatives tried and withdrawn

1. **Raise on every Julian-side day** (`if (rjd < sg) throw`, the first ruling).
   Withdrawn: jd 0 = `-4712-01-01` is Julian-side under the default `ITALY` sg
   (`date.ts:3851`), so it is the BASE CASE of `Date.jd()` / `Date.ordinal()` /
   `Date.commercial()`. It reds **30 ported gem tests across 6 files**, and
   converting them to `expect().toThrow()` drops their MRI-matching assertions
   and takes `parity:test` assertion deltas negative — a hard gate.
2. **Answer the gem-shaped `Date` for Julian-side spellings** (union return).
   Withdrawn by the owner in favour of a seat that answers Temporal or nothing.

### No code change is required

No guard ever landed on `main`: `toDate()` (`packages/date/src/date.ts:8113`)
is unguarded and correct for this decision as written. The narrower raise from
`date-to-date-seat-raises-on-julian-only-spellings` (PR #6272) is untouched — a
Julian-only civil spelling ISO rejects outright (`Date.civil(1500, 2, 29)`)
still raises.

## What is left: record it where the code lives

This story now exists only to leave the trace. CLAUDE.md: _"Every deviation you
do ship is justified at the call site, not in the PR body."_ Today the
divergence is recorded nowhere in `packages/date/src` — the existing
`MAX_SAFE_INTEGER` notes (`:363`, `:1205`, `:1246`) cover `Rational`, a
different path — so without this the finding is rediscovered and re-filed,
which is exactly how it reached this backlog the first time.

## Acceptance criteria

- [ ] `Date#toDate` (`date.ts:8113`) carries a JSDoc note stating: the seat
      renders the civil triple; for a Julian-side receiver `dayOfWeek`,
      `dayOfYear` and the commercial triple do not match MRI; why no seat can
      satisfy both (no Julian calendar in Temporal/CLDR); and that this is a
      ratified RFC 0088 decision, not an oversight.
- [ ] The note names the reopen condition: a Temporal calendar admitting Julian,
      or a decision to seat Julian-side days on the gem-shaped `Date`.
- [ ] `test-switch-hitter.test.ts`'s existing comment — the one explaining why
      `test_commercial` / `test_fractional` assert through `toString` rather
      than the week readers — points at that note, so the two records agree.
- [ ] `pnpm parity:test --package date` stays at **137/137 (100%)**, measured
      2026-08-18; no test is added, removed, or converted.
- [ ] No baseline row, no SKIP_GROUPS entry, no `@noRailsEquivalent` tag —
      `toDate` HAS a Rails counterpart; the divergence is behavioural and
      belongs in prose at the call site.
