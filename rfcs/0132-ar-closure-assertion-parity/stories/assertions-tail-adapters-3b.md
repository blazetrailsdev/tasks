---
title: "assertion parity tail: adapters files, batch 3b"
status: ready
updated: 2026-08-13
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This RFC counts assertion parity, not only name parity: a test that matches
Rails by name but asserts a different number or a different kind of assertion
is not a port of that test. `pnpm parity:test -- --package activerecord
--assertions` reports these per file today (report-only,
`scripts/test-compare/compare.ts:606-663`), and RFC 0025's ratchet
(`scripts/test-compare/assertion-mismatch-mark.json`, PR #5790) pins them so
they cannot grow. This story burns down one Rails source cluster.

Measured 2026-08-13 (`pnpm parity:test -- --cached --package activerecord --assertions`):

| Rails test file (under `vendor/rails/activerecord/test/cases/`) | count | kind | value |
| --------------------------------------------------------------- | ----: | ---: | ----: |
| `connection_adapters/registration_test.rb`                      |     0 |    4 |     0 |
| `adapters/postgresql/full_text_test.rb`                         |     2 |    2 |     0 |
| `adapters/postgresql/transaction_test.rb`                       |     2 |    2 |     0 |
| `adapters/sqlite3/virtual_table_test.rb`                        |     2 |    2 |     0 |
| `adapters/postgresql/bit_string_test.rb`                        |     2 |    2 |     0 |
| `adapters/postgresql/virtual_column_test.rb`                    |     0 |    4 |     0 |
| `adapters/abstract_mysql_adapter/sp_test.rb`                    |     1 |    3 |     0 |
| `adapters/postgresql/utils_test.rb`                             |     1 |    2 |     0 |
| `adapters/postgresql/numbers_test.rb`                           |     0 |    3 |     0 |
| `connection_adapters/adapter_leasing_test.rb`                   |     0 |    3 |     0 |
| `connection_adapters/connection_swapping_nested_test.rb`        |     0 |    3 |     0 |
| `adapters/postgresql/ltree_test.rb`                             |     1 |    2 |     0 |
| `adapters/postgresql/transaction_nested_test.rb`                |     2 |    1 |     0 |
| `adapters/mysql2/check_constraint_quoting_test.rb`              |     1 |    1 |     0 |
| `adapters/postgresql/statement_pool_test.rb`                    |     0 |    2 |     0 |
| `adapters/abstract_mysql_adapter/optimizer_hints_test.rb`       |     0 |    1 |     1 |
| `adapters/abstract_mysql_adapter/set_test.rb`                   |     0 |    2 |     0 |
| `adapters/postgresql/case_insensitive_test.rb`                  |     1 |    1 |     0 |

**56 divergences** (15 assertion-count, 40 assertion-kind, 1
assertion-value). Expand per test with `pnpm parity:test -- --package
activerecord --assertions --missing` and grep for the file; each line prints
`rails N vs trails M`. The trails counterparts are at the convention TS path
the same report prints beside the Ruby file.

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order (`assert_equal` → `toEqual`,
`assert_nil` → `toBeNull`, `assert_predicate`/`assert` → the mapped kind in
`scripts/test-compare/assertion-kinds.ts`). Where the port legitimately cannot
mirror an assertion — a Ruby-only value protocol, an async surface that needs
`await expect(...)` — say so at the call site in a comment; do not reword the
test name (CLAUDE.md: test names are the parity key).

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --package activerecord
--assertions`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly
  this story's contribution (the ratchet lowers on a passing run; do not
  hand-edit it upward).
- No test name changes; `pnpm parity:test` percent for activerecord does not
  drop.
- No new rows in `scripts/parity/unported-files/`.
