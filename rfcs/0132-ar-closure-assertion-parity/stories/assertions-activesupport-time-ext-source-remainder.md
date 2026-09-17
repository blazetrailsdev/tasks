---
title: "assertions-activesupport-time-ext-source-remainder"
status: ready
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: ["activesupport", "date"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-time-ext`, whose PR converged
`vendor/rails/activesupport/test/core_ext/time_ext_test.rb` against
`packages/activesupport/src/core-ext/time-ext.test.ts` from 63 count / 72 kind /
2 value down to 15 count / 21 kind / 0 value (measured 2026-09-16,
`pnpm parity:test -- --assertions --missing --package activesupport`). The rows
left need `Time` source work in `packages/date/src/time.ts` or
`packages/activesupport/src/core-ext/time/*`:

| test                                                                                                                                  | rails vs trails       | blocker                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sec fraction`                                                                                                                        | 6 vs 1                | `Time#sec_fraction` returns a `number`; Rails asserts `assert_kind_of Rational` (`core_ext/time/calculations.rb` `sec_fraction`).                              |
| `floor`, `ceil`                                                                                                                       | 5 vs 2, 7 vs 2        | Ruby core `Time#floor(ndigits)` / `Time#ceil(ndigits)` unported on `packages/date` `Time`.                                                                     |
| `change preserves offset for zoned times around end of dst`, `... fractional hour offset ...`, `... fractional seconds on zoned time` | 12/13, 12/13, 2 vs 5  | `Time.new(..., Time.zone)` — a `TimeZone` object as the zone argument (Ruby's timezone-object protocol: `local_to_utc` / `utc_to_local`); also `Time#inspect`. |
| `advance`                                                                                                                             | 25 vs 22              | same `Time.new(..., ActiveSupport::TimeZone["Moscow"])` arm (3 assertions omitted).                                                                            |
| `advance gregorian proleptic`                                                                                                         | 6 vs 2                | `Time#advance` across the 1582 calendar reform.                                                                                                                |
| `to date`, `to datetime`, `to time`, `rfc3339 with fractional seconds`                                                                | 1/3, 4/3, 3/1, 1 vs 0 | `Time#to_time` returns a `Temporal.ZonedDateTime` (not a `Time`); `Time#to_datetime` has no `start`; `Time#rfc3339` alias missing on the prototype.            |
| `past/future with time current as time local/with zone` (4 tests)                                                                     | 6 vs 1-2              | `Time.stub(:current, ...)` — no trails stub for `Time.current`.                                                                                                |
| `at with datetime`, `at with time with zone`, `at with in option`                                                                     | raises 1 vs 2, 1 vs 3 | `Time.at(time, in:)` kwarg unported.                                                                                                                           |
| `case equality`                                                                                                                       | 6 vs 1                | `Time.===` override (`core_ext/time/calculations.rb` `===`).                                                                                                   |

## Acceptance criteria

- `core_ext/time_ext_test.rb` reports 0 count/kind/value mismatches.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes.
