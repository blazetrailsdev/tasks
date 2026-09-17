---
title: "assertions-activesupport-time-with-zone-structural-remainder"
status: ready
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: ["activesupport"]
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

Remainder of `assertions-activesupport-time-with-zone-test`, whose PR converged
`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb` against
`packages/activesupport/src/core-ext/time-with-zone.test.ts` from 78 count / 86
kind / 13 value down to the rows below (measured 2026-09-16 with
`pnpm parity:test -- --assertions --missing --package activesupport`). Every
row left needs a source port, not a test reshape:

| test                                                                                  | rails vs trails | blocker                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xmlschema with fractional seconds`                                                   | 3 vs 2          | `@twz + 0.1234560001` keeps the Float's sub-nanosecond binary fraction (`xmlschema(12)` → `...123456000100`); `TimeWithZone` stores a `Temporal.Instant`, which stops at nanoseconds. Structural. |
| `plus with invalid argument`, `minus with time with zone without preserve configured` | 2 vs 1          | `assert_not_deprecated` has no trails port (`activesupport/lib/active_support/testing/deprecation.rb`).                                                                                           |
| `to time without preserve timezone configured`                                        | 7 vs 3          | same, plus `assert_deprecated` and `ActiveSupport.to_time_preserves_timezone`.                                                                                                                    |
| `is a`                                                                                | 3 vs 1          | `TimeWithZone#is_a?`/`kind_of?` (`time_with_zone.rb` `is_a?`) answering `Time`.                                                                                                                   |
| `marshal dump and load` (+ `with tzinfo identifier`)                                  | 6 vs 3, 6 vs 2  | `TimeWithZone#marshal_dump`/`marshal_load` (`time_with_zone.rb`) unported; the trails test round-trips JSON.                                                                                      |
| `date part value methods`                                                             | 10 vs 9         | `assert_not_called(twz, :method_missing)` has no trails port.                                                                                                                                     |
| `no method error has proper context`                                                  | 3 vs 1          | the method_missing Proxy returns `undefined` for an unknown name instead of raising `NoMethodError` with `"undefined method ... for ... ActiveSupport::TimeWithZone"`.                            |

## Acceptance criteria

- Each row above reports 0 count/kind/value mismatches, or is recorded as structural with its reason.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes.
