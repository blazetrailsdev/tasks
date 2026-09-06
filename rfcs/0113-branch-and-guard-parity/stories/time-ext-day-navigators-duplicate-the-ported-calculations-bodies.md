---
title: "time-ext-day-navigators-duplicate-the-ported-calculations-bodies"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 41
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7518, which converged the week-BOUNDARY half of this same
finding (`time-ext-week-boundaries-duplicate-the-ported-calculations-bodies`).

`time-ext.ts` still holds its own bodies for the day-of-week navigators, next
to the faithful ported ones:

- `packages/activesupport/src/time-ext.ts` — `nextOccurring`, `prevOccurring`,
  and `dayIndex`, a file-local helper with no Rails counterpart

Rails has one body each, in `DateAndTime::Calculations`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`):

```ruby
def next_occurring(day_of_week)                             # :328-332
  from_now = DAYS_INTO_WEEK.fetch(day_of_week) - wday
  from_now += 7 unless from_now > 0
  advance(days: from_now)
end

def prev_occurring(day_of_week)                             # :336-340
  ago = wday - DAYS_INTO_WEEK.fetch(day_of_week)
  ago += 7 unless ago > 0
  ago(ago.days)
end
```

and trails already carries both at
`core-ext/date-and-time/calculations.ts:477-495`, resolving the day through
`fetch(DAYS_INTO_WEEK, dayOfWeek)`.

`time-ext.ts`'s copies compute the offset with raw `Date#setDate` arithmetic
through `dayIndex`, which lower-cases its argument and raises its own
`KeyError` — where Rails' `DAYS_INTO_WEEK.fetch` raises on the exact key. Two
TS bodies for one Rails method, plus a helper Rails does not have.

`dayIndex` is the last thing keeping PR #7518 from meeting its story's
"no `dayIndex`" acceptance criterion: these two are its only remaining callers.

## Converged shape

Delete `nextOccurring`, `prevOccurring` and `dayIndex` from `time-ext.ts`;
re-export the ported bodies from `./core-ext/date-and-time/calculations.js`,
exactly as #7271 did for `nextWeek` / `prevWeek` / `lastWeek` and #7518 did for
`beginningOfWeek` / `endOfWeek` / `allWeek`.

Watch the module graph: `core-ext/date-and-time/calculations.ts` imports
`time-ext.ts`, so verify both directions by importing the BUILT `dist/**.js`
modules as entry modules in a plain node process — a vitest run enters the
funnel module first and masks a TDZ.

## Acceptance criteria

- [ ] `time-ext.ts` holds no second body for `next_occurring` or
      `prev_occurring`, and no `dayIndex`.
- [ ] The re-exported bodies resolve the day through
      `fetch(DAYS_INTO_WEEK, ...)`, so an unknown day raises Ruby's `KeyError`
      on the exact key rather than a lower-cased one.
- [ ] `dist/time-ext.js`, `dist/index.js` and
      `dist/core-ext/date-and-time/calculations.js` each import cleanly as an
      entry module in a plain node process.
- [ ] `pnpm parity:api:extra` for activesupport does not grow; touched suites
      green.
