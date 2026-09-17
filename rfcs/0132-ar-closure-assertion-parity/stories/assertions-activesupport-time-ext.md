---
title: "assertions-activesupport-time-ext"
status: done
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7847
claim: "2026-09-16T23:43:56Z"
assignee: "assertions-activesupport-logging-tail"
blocked-by: null
closed-reason: null
---

## Context

Split from `assertions-activesupport-time-datetime-duration` (which shipped the
`core_ext/duration_test.rb` slice). Untouched, measured 2026-09-15 with
`pnpm parity:test -- --assertions --missing --package activesupport`:

| Rails test file             | count | kind | value |
| --------------------------- | ----: | ---: | ----: |
| `core_ext/time_ext_test.rb` |    63 |   72 |     2 |

Trails counterpart: `packages/activesupport/src/core-ext/time-ext.test.ts`
(Rails `vendor/rails/activesupport/test/core_ext/time_ext_test.rb`). Biggest
rows: `advance` (25 vs 3), `utc advance`/`offset advance` (19 vs 5), `to fs`
(22 vs 13), `rfc3339 parse` (14 vs 7), the DST crossings tests (12 vs 3-5).
Expect more than one PR; ship what fits and file the rest.

## Acceptance criteria

- `core_ext/time_ext_test.rb` reports 0 count/kind/value mismatches.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes; activesupport `parity:test` percent does not drop.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
