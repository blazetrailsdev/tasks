---
title: "activesupport-core-ext-calculations-delegation"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6190
claim: "2026-08-07T18:32:39Z"
assignee: "activesupport-core-ext-calculations-delegation"
blocked-by: null
closed-reason: null
---

## Context

`api-compare-orphan-buckets-activesupport-calculations` pointed the three
activesupport `calculations.rb` reopenings at their real TS home:

- `activesupport:core_ext/time/calculations.rb` → `time-ext.ts`
- `activesupport:core_ext/date/calculations.rb` → `time-ext.ts`
- `activesupport:core_ext/date_time/calculations.rb` → `time-ext.ts`

(`RUBY_FILE_TS_OVERRIDES` in `scripts/api-compare/conventions.ts`.) That
matched 43 previously-invisible methods and, with them, surfaced 25 pre-existing
call-set divergences that are now baselined in
`scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json`.

They are all the same class of divergence. `packages/activesupport/src/time-ext.ts`
is a bespoke free-function module over JS `Date` that computes each result
inline, where Rails' calculations decompose through a small set of primitives:

- `vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb`
  — `beginning_of_day`/`middle_of_day`/`end_of_day`/`beginning_of_hour`/
  `end_of_hour`/`beginning_of_minute`/`end_of_minute`/`seconds_since_midnight`
  all route through `change` (:139-208); `prev_day`/`next_day`/`prev_month`/
  `next_month`/`prev_year`/`next_year` all route through `advance` (:220-256);
  `ago` is `since(-seconds)` (:120); `days_in_year` calls `days_in_month`
  (:39-45).
- `vendor/rails/activesupport/lib/active_support/core_ext/date/calculations.rb`
  — `advance` goes through `to_date`; the day-boundary readers go through
  `change`.
- `vendor/rails/activesupport/lib/active_support/core_ext/date_time/calculations.rb`
  — same shape, plus `seconds_until_end_of_day` delegating to `end_of_day`.

The `in_time_zone` omissions are the same story from the other side: Rails'
`beginning_of_day`/`middle_of_day`/`end_of_day` on `Time` consult
`ActiveSupport.to_time_preserves_timezone` / `in_time_zone`, and time-ext.ts
does not.

## Acceptance criteria

- `time-ext.ts` bodies delegate the way Rails' `calculations.rb` bodies do:
  the boundary readers through `change`, the navigation readers through
  `advance`, `ago` through `since`, `days_in_year` through `days_in_month`,
  `seconds_until_end_of_day` through `end_of_day`.
- Every row in
  `scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json` that
  the convergence retires is DELETED from the baseline by hand (the baseline is
  only-shrink; do not `--write`/reseed).
- `pnpm parity:api:calls` green with a strictly smaller `time-ext.json`.
- `packages/activesupport/src/core-ext/{time,date,date-time}-ext.test.ts` and
  `packages/activesupport/src/time-ext.test.ts` stay green.
- No test renames.
