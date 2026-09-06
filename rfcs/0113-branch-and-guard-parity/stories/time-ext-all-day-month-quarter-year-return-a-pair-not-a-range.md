---
title: "time-ext.ts's all_day/all_month/all_quarter/all_year return {start,end} where Rails returns a Range"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 42
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7518, which converged `all_week`
(`time-ext-week-boundaries-duplicate-the-ported-calculations-bodies`) and left
its four siblings.

Rails' `DateAndTime::Calculations` returns a Range from every one of them
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb:311-336`):

```ruby
def all_day;     beginning_of_day..end_of_day;         end   # :311
def all_week(start_day = Date.beginning_of_week)             # :316
  beginning_of_week(start_day)..end_of_week(start_day)
end
def all_month;   beginning_of_month..end_of_month;     end   # :321
def all_quarter; beginning_of_quarter..end_of_quarter; end   # :326
def all_year;    beginning_of_year..end_of_year;       end   # :331
```

and trails already carries all five faithfully at
`packages/activesupport/src/core-ext/date-and-time/calculations.ts:447-470`,
returning `Range` from `@blazetrails/ruby-compat`.

`packages/activesupport/src/time-ext.ts` still holds its own second bodies for
four of them — `allDay`, `allMonth`, `allQuarter`, `allYear` — each returning
`{ start, end }`, a plain object with two invented field names where Rails
returns a Range with `begin` / `end` / `exclude_end?`. #7518 removed the fifth
(`allWeek`) by re-exporting the ported body, so `time-ext.ts` now returns a
Range from one of the five and a pair from the other four.

This is the same residue as
`time-ext-week-boundaries-duplicate-the-ported-calculations-bodies` and
`time-ext-day-navigators-duplicate-the-ported-calculations-bodies`: one Rails
method with two TS bodies.

## Converged shape

Delete `allDay`, `allMonth`, `allQuarter` and `allYear` from `time-ext.ts` and
re-export the ported bodies from `./core-ext/date-and-time/calculations.js`,
exactly as #7271 did for `nextWeek` / `prevWeek` / `lastWeek` and #7518 did for
`allWeek`.

Update the `{ start, end }` destructurings in `time-ext.test.ts` and
`core-ext/date-ext.test.ts` to `{ begin, end }`; `date-ext.test.ts` already has
a `rubyRange` helper #7518 added for exactly this, and its older `range` helper
can go once the last `{ start, end }` caller does.

Watch the module graph: `core-ext/date-and-time/calculations.ts` imports
`time-ext.ts`, so verify both directions by importing the BUILT `dist/**.js`
modules as entry modules in a plain node process — a vitest run enters the
funnel module first and masks a TDZ.

## Acceptance criteria

- [ ] `time-ext.ts` holds no second body for `all_day`, `all_month`,
      `all_quarter` or `all_year`, and every `all_*` it exports answers a
      `Range`.
- [ ] `date-ext.test.ts`'s `range` helper is gone, `rubyRange` being the only
      one left.
- [ ] `dist/time-ext.js`, `dist/index.js` and
      `dist/core-ext/date-and-time/calculations.js` each import cleanly as an
      entry module in a plain node process.
- [ ] `pnpm parity:api:extra` for activesupport does not grow; touched suites
      green.
