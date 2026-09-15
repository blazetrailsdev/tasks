---
title: "assertions-activesupport-date-time-ext"
status: draft
updated: 2026-09-15
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
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

Split from `assertions-activesupport-time-datetime-duration` (which shipped the
`core_ext/duration_test.rb` slice). Untouched, measured 2026-09-15 with
`pnpm parity:test -- --assertions --missing --package activesupport`:

| Rails test file                  | count | kind | value |
| -------------------------------- | ----: | ---: | ----: |
| `core_ext/date_time_ext_test.rb` |    51 |   56 |     0 |

Trails counterpart: `packages/activesupport/src/core-ext/date-time-ext.test.ts`
Expect more than one PR; ship what fits and file the rest.

## Acceptance criteria

- `core_ext/date_time_ext_test.rb` reports 0 count/kind/value mismatches.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this story's contribution.
- No test name changes; activesupport `parity:test` percent does not drop.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
