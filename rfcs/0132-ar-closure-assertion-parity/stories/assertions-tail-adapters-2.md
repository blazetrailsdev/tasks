---
title: "assertion parity tail: adapters files, batch 2"
status: ready
updated: 2026-08-13
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 296
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

| Rails test file (under `vendor/rails/activerecord/test/cases/`)  | count | kind | value |
| ---------------------------------------------------------------- | ----: | ---: | ----: |
| `connection_adapters/connection_handlers_sharding_db_test.rb`    |     3 |    9 |     3 |
| `adapters/abstract_mysql_adapter/table_options_test.rb`          |     7 |    8 |     0 |
| `adapters/abstract_mysql_adapter/bind_parameter_test.rb`         |     3 |   10 |     0 |
| `adapters/postgresql/connection_test.rb`                         |     4 |    8 |     0 |
| `adapters/postgresql/datatype_test.rb`                           |     6 |    6 |     0 |
| `adapters/abstract_mysql_adapter/adapter_prevent_writes_test.rb` |     0 |   12 |     0 |
| `adapters/postgresql/money_test.rb`                              |     1 |   10 |     0 |
| `adapters/sqlite3/copy_table_test.rb`                            |     0 |   10 |     0 |
| `adapters/postgresql/timestamp_test.rb`                          |     5 |    5 |     0 |
| `adapters/postgresql/invertible_migration_test.rb`               |     3 |    6 |     0 |
| `adapters/postgresql/hstore_test.rb`                             |     1 |    8 |     0 |
| `adapters/abstract_mysql_adapter/active_schema_test.rb`          |     3 |    6 |     0 |
| `adapters/postgresql/explain_test.rb`                            |     4 |    4 |     0 |
| `adapters/postgresql/date_test.rb`                               |     4 |    4 |     0 |
| `adapters/abstract_mysql_adapter/warnings_test.rb`               |     3 |    5 |     0 |
| `adapters/postgresql/rename_table_test.rb`                       |     4 |    4 |     0 |
| `adapters/postgresql/schema_authorization_test.rb`               |     3 |    5 |     0 |
| `adapters/sqlite3/virtual_column_test.rb`                        |     0 |    8 |     0 |

**185 divergences** (54 assertion-count, 128 assertion-kind, 3
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
