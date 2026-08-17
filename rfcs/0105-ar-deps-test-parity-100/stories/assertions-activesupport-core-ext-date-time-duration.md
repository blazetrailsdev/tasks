---
title: "activesupport Time / Date / DateTime / Duration core_ext assertion parity"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6644
claim: "2026-08-17T11:25:49Z"
assignee: "assertions-activesupport-core-ext-date-time-duration"
blocked-by: null
closed-reason: null
---

## Context

RFC 0105 counts assertion parity, not only name parity: a test that matches
Rails by name but asserts a different number, a different kind, or a different
expected value than the Rails test is not a port of that test. PR #6507 widened
`ASSERTION_REPORT_PACKAGES` (`scripts/test-compare/compare.ts:76-88`) from
activerecord alone to the full RFC 0105 closure and seeded
`scripts/test-compare/assertion-mismatch-mark.json` at the measured values,
surfacing 5,036 divergences across the non-AR packages. The triage story
`burn-down-non-ar-assertion-parity-debt` split that total into this cluster and
its siblings; this one burns down the `activesupport` files below.

Measured 2026-08-14 (`pnpm parity:test -- --assertions --package activesupport`),
against `vendor/rails/activesupport/test/`:

| Rails test file                  | count | kind | value |
| -------------------------------- | ----: | ---: | ----: |
| `core_ext/time_ext_test.rb`      |    63 |   72 |     2 |
| `core_ext/date_time_ext_test.rb` |    51 |   56 |     0 |
| `core_ext/duration_test.rb`      |    36 |   52 |     1 |
| `core_ext/date_ext_test.rb`      |    24 |   31 |     0 |

**388 divergences** (174 assertion-count, 211 assertion-kind, 3
assertion-value). Expand per test with
`pnpm parity:test -- --assertions --missing --package activesupport` and grep for the
file; each line prints `rails N vs trails M`, and the kind lines print the
per-kind delta. The trails counterparts are at the convention TS path the same
report prints beside the Ruby file.

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values (`assert_equal` -> `toEqual`, `assert_nil` -> `toBeNull`,
`assert_predicate`/`assert` -> the mapped kind in
`scripts/test-compare/assertion-kinds.ts`). Where the port legitimately cannot
mirror an assertion — a Ruby-only value protocol, an async surface that needs
`await expect(...)` — say so at the call site in a comment; do not reword the
test name (CLAUDE.md: test names are the parity key), and never loosen the
Rails side or reseed the mark upward.

If the cluster is larger than one PR, ship the files that fit and file the rest
as a sibling story under this RFC rather than growing the PR.

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activesupport`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  story's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope or dropping a
  measured package).
- No test name changes; `pnpm parity:test` percent for activesupport does not drop.
- No new rows in `scripts/parity/unported-files/`.
