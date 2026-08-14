---
title: "arel attribute and node assertion parity"
status: ready
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 340
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

| Rails test file                   | count | kind | value |
| --------------------------------- | ----: | ---: | ----: |
| `attributes/attribute_test.rb`    |    15 |  124 |     0 |
| `attributes/math_test.rb`         |     9 |   10 |     0 |
| `nodes/sql_literal_test.rb`       |     3 |   10 |     0 |
| `nodes/ascending_test.rb`         |     2 |    5 |     0 |
| `nodes/descending_test.rb`        |     2 |    5 |     0 |
| `nodes/over_test.rb`              |     1 |    6 |     0 |
| `nodes/case_test.rb`              |     2 |    5 |     0 |
| `nodes/extract_test.rb`           |     2 |    5 |     0 |
| `nodes/fragments_test.rb`         |     3 |    3 |     1 |
| `nodes/select_core_test.rb`       |     3 |    3 |     0 |
| `nodes/sum_test.rb`               |     2 |    4 |     0 |
| `nodes/equality_test.rb`          |     2 |    3 |     0 |
| `nodes/infix_operation_test.rb`   |     2 |    3 |     0 |
| `nodes/unary_operation_test.rb`   |     1 |    4 |     0 |
| `nodes/count_test.rb`             |     1 |    4 |     0 |
| `nodes/cte_test.rb`               |     1 |    3 |     1 |
| `nodes/and_test.rb`               |     2 |    3 |     0 |
| `nodes/filter_test.rb`            |     2 |    3 |     0 |
| `nodes/as_test.rb`                |     1 |    3 |     0 |
| `nodes/named_function_test.rb`    |     1 |    2 |     1 |
| `nodes/bind_param_test.rb`        |     2 |    2 |     0 |
| `nodes/node_test.rb`              |     2 |    2 |     0 |
| `nodes/insert_statement_test.rb`  |     1 |    2 |     0 |
| `nodes/or_test.rb`                |     1 |    2 |     0 |
| `nodes/select_statement_test.rb`  |     1 |    2 |     0 |
| `nodes/table_alias_test.rb`       |     1 |    2 |     0 |
| `nodes/bound_sql_literal_test.rb` |     1 |    1 |     1 |
| `nodes/window_test.rb`            |     0 |    3 |     0 |
| `nodes/casted_test.rb`            |     1 |    1 |     0 |
| `nodes/bin_test.rb`               |     0 |    2 |     0 |
| `nodes/delete_statement_test.rb`  |     0 |    2 |     0 |
| `nodes/grouping_test.rb`          |     0 |    2 |     0 |
| `nodes/not_test.rb`               |     0 |    2 |     0 |
| `nodes/update_statement_test.rb`  |     0 |    2 |     0 |
| `nodes/homogeneous_in_test.rb`    |     0 |    2 |     0 |
| `nodes/comment_test.rb`           |     0 |    1 |     0 |
| `nodes/distinct_test.rb`          |     0 |    1 |     0 |
| `nodes/false_test.rb`             |     0 |    1 |     0 |
| `nodes/true_test.rb`              |     0 |    1 |     0 |

**312 divergences** (67 assertion-count, 241 assertion-kind, 4
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
