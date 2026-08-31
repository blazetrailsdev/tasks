---
title: "assertions-activesupport-time-datetime-duration"
status: ready
updated: 2026-08-17
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
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

Sibling of `assertions-activesupport-core-ext-date-time-duration` (RFC 0105),
which shipped the `core_ext/date_ext_test.rb` slice and hit the PR LOC ceiling.
The three remaining files in that cluster are untouched. Measured after that PR:

| Rails test file                  | count | kind | value |
| -------------------------------- | ----: | ---: | ----: |
| `core_ext/time_ext_test.rb`      |    63 |   72 |     2 |
| `core_ext/date_time_ext_test.rb` |    51 |   56 |     0 |
| `core_ext/duration_test.rb`      |    36 |   52 |     1 |

Expand per test with
`pnpm parity:test -- --assertions --missing --package activesupport` and grep for
the file. The trails counterparts are at the convention TS path the report
prints beside the Ruby file.

Direction is Rails-ward: our test asserts what the Rails test asserts, with the
same assertion kinds in the same order and the same literal expected values.
Where the port legitimately cannot mirror an assertion, say so at the call site;
never reword a test name and never reseed the mark upward.

Expect this to need more than one PR — ship the file that fits and file the rest.

## Acceptance criteria

- The three files above report 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activesupport`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this
  story's contribution.
- No test name changes; `pnpm parity:test` percent for activesupport does not drop.
