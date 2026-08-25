---
title: "Port date_time/conversions.rb onto the DateTime receiver; port to_i / to_f"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6628
claim: "2026-08-17T02:02:56Z"
assignee: "port-date-time-conversions-onto-its-own-receiver"
blocked-by: null
closed-reason: null
---

## Context

`core_ext/date_time/calculations.rb`'s 29 members now live on the DateTime
receiver (`packages/activesupport/src/core-ext/date-time/calculations.ts`,
PR #6623), and `RUBY_FILE_TS_OVERRIDES` points that Ruby file at it. Its
sibling `core_ext/date_time/conversions.rb` did NOT move: the override at
`scripts/parity/conventions.ts` still maps
`activesupport:core_ext/date_time/conversions.rb` -> `time-ext.ts`, where
`usec`, `nsec`, `offsetInSeconds`, `secondsSinceUnixEpoch`, `toFs`,
`xmlschema` and friends sit next to the `Time` arm they are not.

Two concrete consequences visible today:

- `DateTime#to_i` (`vendor/rails/activesupport/lib/active_support/core_ext/date_time/conversions.rb:84-86`,
  `seconds_since_unix_epoch.to_i`) and `#to_f` (`:79-82`) are NOT ported at
  all. `secondsUntilEndOfDay`
  (`packages/activesupport/src/core-ext/date-time/calculations.ts`) therefore
  inlines the body as
  `Math.trunc(secondsSinceUnixEpoch(...)) - Math.trunc(secondsSinceUnixEpoch(...))`
  where Rails writes `end_of_day.to_i - to_i`
  (`core_ext/date_time/calculations.rb:29-31`).
- `time-ext.ts` now imports `secondsSinceMidnight` back out of
  `core-ext/date-time/calculations.ts` so its `secondsSinceUnixEpoch` — a
  `conversions.rb` member — can reach the DateTime reader. The import cycle is
  benign (both sides are hoisted function declarations, used only at call
  time) but it exists only because the two halves of one Ruby receiver are
  split across two TS files.

## Converged shape

Move `core_ext/date_time/conversions.rb`'s members onto the same DateTime
receiver — `core-ext/date-time/conversions.ts`, the path the default rule
already produces — and flip
`"activesupport:core_ext/date_time/conversions.rb"` in
`RUBY_FILE_TS_OVERRIDES` (`scripts/parity/conventions.ts`) to it, with
`conventions.test.ts`'s expectation following, exactly as PR #6623 did for
`calculations.rb`. Port `to_i` and `to_f` as part of that move and call `toI`
from `secondsUntilEndOfDay` instead of the inlined `Math.trunc`. The
`time-ext.ts` -> `date-time/calculations.ts` import disappears with it.

Measure before/after: `time-ext.ts` must not lose methods (`time/calculations.rb`
is at 38/38 and `time/conversions.rb` has its own count), and
`date_time/conversions.rb` should go from its current partial score against
`time-ext.ts` to a full one against the new file.

## Acceptance criteria

- [ ] `core_ext/date_time/conversions.rb`'s members are ported onto
      `core-ext/date-time/conversions.ts` with Rails' bodies, `to_i` / `to_f`
      included.
- [ ] `RUBY_FILE_TS_OVERRIDES` maps `core_ext/date_time/conversions.rb` to
      that file, and `conventions.test.ts` follows.
- [ ] `secondsUntilEndOfDay` calls the ported `to_i` rather than inlining
      `Math.trunc(secondsSinceUnixEpoch(...))`.
- [ ] `time-ext.ts` no longer imports from `core-ext/date-time/calculations.ts`.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
