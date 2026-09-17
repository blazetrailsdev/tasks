---
title: "assertions-activesupport-time-zone-test"
status: done
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7837
claim: "2026-09-16T14:32:47Z"
assignee: "size-and-file-assertion-work-for-widened-packages"
blocked-by: null
closed-reason: null
---

## Context

Split from `assertions-activesupport-time-zone-and-travel` (time_travel_test.rb shipped there;
this file did not fit the PR ceiling). `vendor/rails/activesupport/test/time_zone_test.rb` vs
`packages/activesupport/src/time-zone.test.ts` measured 77 assertion-count, 79 kind, 2 value
mismatches (`pnpm parity:test -- --assertions --missing --package activesupport | grep time_zone_test`).
Most trails tests assert individual `hour`/`day` fields where Rails asserts
`assert_equal Time.utc(...), twz.time` / `twz.utc` / `zone, twz.time_zone`, or `twz.to_a[0, 6]`;
the value rows are `to s` (Rails uses "New Delhi") and `utc offset lazy loaded...` (-18000).

## Acceptance criteria

- time_zone_test.rb reports 0 count/kind/value mismatches.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
