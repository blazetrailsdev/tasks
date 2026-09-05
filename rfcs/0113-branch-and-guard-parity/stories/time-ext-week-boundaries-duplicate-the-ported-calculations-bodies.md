---
title: "time-ext.ts holds second bodies for beginning_of_week/end_of_week/all_week alongside the ported DateAndTime::Calculations ones"
status: done
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 28
pr: 7518
claim: "2026-09-05T11:02:18Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the week-start day spelling in PR #7271 (RFC 0113).

That PR found `time-ext.ts` held its own Monday-relative reimplementations of
`next_week` / `prev_week` / `last_week`, diverging from the faithful bodies in
`packages/activesupport/src/core-ext/date-and-time/calculations.ts`, and
deleted them in favour of re-exporting the ported ones. The same duplication
remains for the three week-BOUNDARY methods, which #7271 only re-parameterised:

- `time-ext.ts:135-161` — `_beginningOfWeekDate`, `beginningOfWeek`, `endOfWeek`
- `time-ext.ts:400-406` — `allWeek`
- `time-ext.ts:23-27` — `dayIndex`, a file-local helper with no Rails counterpart

Rails has one body each, in `DateAndTime::Calculations`
(`activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`):

```ruby
def beginning_of_week(start_day = Date.beginning_of_week)   # :267-270
  result = first_hour(days_ago(days_to_week_start(start_day)))
  acts_like?(:date) ? result : copy_time_to(result)
end

def end_of_week(start_day = Date.beginning_of_week)         # :283-285
  last_hour(days_since(6 - days_to_week_start(start_day)))
end

def all_week(start_day = Date.beginning_of_week)            # :316-318
  beginning_of_week(start_day)..end_of_week(start_day)
end
```

and trails already carries all three at
`core-ext/date-and-time/calculations.ts:546-553`, `:567-574`, `:616-621`,
resolving the start day through `daysToWeekStart` / `DAYS_INTO_WEEK`.

`time-ext.ts`'s copies compute the boundary with raw `Date#setDate`
arithmetic instead — one Rails method with two TS bodies, and the
`_beginningOfWeekDate` helper and `dayIndex` are surface Rails does not have.
`allWeek` also returns `{ start, end }` where Rails returns a `Range`, which
the ported `allWeek` already models.

This is the residue of the same finding #7271 closed for the next/prev trio;
it was left out of that PR to keep it inside the LOC ceiling and scoped to the
claimed story.

## Converged shape

Delete `_beginningOfWeekDate`, `dayIndex`, and `time-ext.ts`'s
`beginningOfWeek` / `endOfWeek` / `allWeek`; re-export the ported bodies from
`./core-ext/date-and-time/calculations.js`, exactly as #7271 did for
`nextWeek` / `prevWeek` / `lastWeek`. Update the `time-ext.test.ts` /
`date-ext.test.ts` / `time/conversions` call sites for the `Range` return of
`allWeek` where they destructure `{ start, end }`.

Watch the module graph: `core-ext/date-and-time/calculations.ts` imports
`time-ext.ts`, so verify both directions by importing the BUILT
`dist/**.js` entry modules in a plain node process (a vitest run enters the
funnel module first and masks a TDZ).

## Acceptance criteria

- [ ] `time-ext.ts` holds no second body for `beginning_of_week`,
      `end_of_week` or `all_week`, and no `_beginningOfWeekDate` / `dayIndex`.
- [ ] The re-exported bodies resolve the start day through `DAYS_INTO_WEEK`.
- [ ] `dist/time-ext.js`, `dist/index.js` and
      `dist/core-ext/date-and-time/calculations.js` each import cleanly as an
      entry module in a plain node process.
- [ ] `pnpm parity:api:extra` for activesupport does not grow; touched suites green.
