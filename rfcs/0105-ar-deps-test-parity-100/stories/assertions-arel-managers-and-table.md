---
title: "arel manager and table assertion parity"
status: closed
updated: 2026-08-31
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "arel assertion parity was delivered by RFC 0122-arel-assertion-parity; assertion-mismatch-mark.json reads arel 0/0/0 on all three dimensions, so this story has nothing left to burn down."
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

| Rails test file                                | count | kind | value |
| ---------------------------------------------- | ----: | ---: | ----: |
| `select_manager_test.rb`                       |    29 |   93 |     0 |
| `table_test.rb`                                |     6 |   18 |     1 |
| `insert_manager_test.rb`                       |     4 |   17 |     0 |
| `factory_methods_test.rb`                      |     8 |    8 |     1 |
| `update_manager_test.rb`                       |     5 |   11 |     0 |
| `delete_manager_test.rb`                       |     1 |    4 |     0 |
| `collectors/composite_test.rb`                 |     2 |    2 |     0 |
| `collectors/substitute_bind_collector_test.rb` |     1 |    0 |     2 |
| `crud_test.rb`                                 |     0 |    3 |     0 |
| `collectors/bind_test.rb`                      |     1 |    1 |     0 |
| `nodes_test.rb`                                |     1 |    1 |     0 |
| `attributes_test.rb`                           |     0 |    1 |     0 |
| `collectors/sql_string_test.rb`                |     0 |    0 |     1 |

**222 divergences** (58 assertion-count, 159 assertion-kind, 5
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
