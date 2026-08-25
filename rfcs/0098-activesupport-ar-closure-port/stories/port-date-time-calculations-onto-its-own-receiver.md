---
title: "port-date-time-calculations-onto-its-own-receiver"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6623
claim: "2026-08-17T00:32:24Z"
assignee: "port-date-time-calculations-onto-its-own-receiver"
blocked-by: null
closed-reason: null
---

## Context

`DateTime.current` now has its own receiver file —
`packages/activesupport/src/core-ext/date-time/calculations.ts`, added by the
`split-date-time-current-onto-its-own-receiver` PR — but the remaining 28
members of `core_ext/date_time/calculations.rb` still live on `time-ext.ts`,
where one TS function serves both the `Time` and the `DateTime` receiver:

    seconds_since_midnight, seconds_until_end_of_day, subsec, change, advance,
    ago, since, in, beginning_of_day (+ midnight / at_midnight /
    at_beginning_of_day), middle_of_day (+ midday / noon / at_midday / at_noon /
    at_middle_of_day), end_of_day (+ at_end_of_day), beginning_of_hour (+
    at_beginning_of_hour), end_of_hour (+ at_end_of_hour), beginning_of_minute
    (+ at_beginning_of_minute), end_of_minute (+ at_end_of_minute)

`RUBY_FILE_TS_OVERRIDES` (`scripts/parity/conventions.ts:199`) maps one Ruby
file to exactly ONE TS file, so `core_ext/date_time/calculations.rb` still has
to point at `time-ext.ts`. Measured on the split PR's branch: flipping the
override to the new file drops activesupport from 1637/2027 to 1609/2027
methods (-28), because the whole set reports missing. Re-exporting the 28 names
from the new file does NOT recover them — the TS extractor counts declarations,
not `export … from` re-exports (measured: still 1/29 on that file).

So the `current` → `to_datetime` row in
`scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json`
survives the `current` split: while the override still names `time-ext.ts`,
`DateTime.current`'s call set is charged to `time-ext.ts`'s `current`, which is
`Time.current` and has no `to_datetime`. The row dies only once the 28 bodies
move and the override flips with them.

Rails source: `vendor/rails/activesupport/lib/active_support/core_ext/date_time/calculations.rb`
(the DateTime bodies), `core_ext/time/calculations.rb` (the Time ones now
standing in for them).

## Acceptance criteria

- [ ] The 28 `date_time/calculations.rb` members are ported onto the DateTime
      receiver in `core-ext/date-time/calculations.ts`, with Rails' bodies and
      alias set.
- [ ] `RUBY_FILE_TS_OVERRIDES` maps `core_ext/date_time/calculations.rb` to
      `core-ext/date-time/calculations.ts`, and `conventions.test.ts`'s
      expectation follows.
- [ ] The `current` → `to_datetime` row is deleted from
      `call-mismatches-exclude/activesupport/time-ext.json`, and the stale
      high-water mark tightened with `pnpm parity:api:calls:tighten`.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
