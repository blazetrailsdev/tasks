---
title: "arel visitor assertion parity"
status: ready
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
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
its siblings; this one burns down the `arel` files below.

Measured 2026-08-14 (`pnpm parity:test -- --assertions --package arel`),
against `vendor/rails/activerecord/test/cases/arel/`:

| Rails test file                           | count | kind | value |
| ----------------------------------------- | ----: | ---: | ----: |
| `visitors/to_sql_test.rb`                 |    24 |  105 |     8 |
| `visitors/postgres_test.rb`               |    13 |   38 |     0 |
| `visitors/dot_test.rb`                    |    12 |   16 |     0 |
| `visitors/mysql_test.rb`                  |     1 |   22 |     0 |
| `visitors/sqlite_test.rb`                 |     3 |    8 |     0 |
| `visitors/dispatch_contamination_test.rb` |     2 |    2 |     0 |

**254 divergences** (55 assertion-count, 191 assertion-kind, 8
assertion-value). Expand per test with
`pnpm parity:test -- --assertions --missing --package arel` and grep for the
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
  assertion-value mismatches in `pnpm parity:test -- --assertions --package arel`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  story's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope or dropping a
  measured package).
- No test name changes; `pnpm parity:test` percent for arel does not drop.
- No new rows in `scripts/parity/unported-files/`.
