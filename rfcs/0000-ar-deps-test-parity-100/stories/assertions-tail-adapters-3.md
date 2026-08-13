---
title: "assertion parity tail: adapters files, batch 3"
status: draft
updated: 2026-08-13
rfc: "0000-ar-deps-test-parity-100"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 304
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

| Rails test file (under `vendor/rails/activerecord/test/cases/`)        | count | kind | value |
| ---------------------------------------------------------------------- | ----: | ---: | ----: |
| `adapters/postgresql/foreign_table_test.rb`                            |     2 |    5 |     0 |
| `adapters/postgresql/network_test.rb`                                  |     0 |    7 |     0 |
| `adapters/abstract_mysql_adapter/mysql_explain_test.rb`                |     3 |    4 |     0 |
| `adapters/abstract_mysql_adapter/schema_test.rb`                       |     2 |    5 |     0 |
| `adapters/postgresql/quoting_test.rb`                                  |     3 |    4 |     0 |
| `adapters/postgresql/extension_migration_test.rb`                      |     2 |    5 |     0 |
| `adapters/postgresql/infinity_test.rb`                                 |     3 |    4 |     0 |
| `adapters/postgresql/referential_integrity_test.rb`                    |     3 |    3 |     0 |
| `adapters/postgresql/deferred_constraints_test.rb`                     |     3 |    3 |     0 |
| `adapters/abstract_mysql_adapter/nested_deadlock_test.rb`              |     3 |    3 |     0 |
| `adapters/postgresql/json_test.rb`                                     |     3 |    3 |     0 |
| `adapters/postgresql/serial_test.rb`                                   |     0 |    6 |     0 |
| `adapters/postgresql/postgresql_adapter_prevent_writes_test.rb`        |     0 |    6 |     0 |
| `adapters/sqlite3/transaction_test.rb`                                 |     0 |    5 |     0 |
| `adapters/postgresql/composite_test.rb`                                |     2 |    3 |     0 |
| `adapters/sqlite3/sqlite_rake_test.rb`                                 |     3 |    1 |     0 |
| `adapters/postgresql/citext_test.rb`                                   |     1 |    3 |     0 |
| `adapters/postgresql/active_schema_test.rb`                            |     2 |    2 |     0 |
| `connection_adapters/registration_test.rb`                             |     0 |    4 |     0 |
| `adapters/postgresql/full_text_test.rb`                                |     2 |    2 |     0 |
| `adapters/postgresql/transaction_test.rb`                              |     2 |    2 |     0 |
| `adapters/sqlite3/virtual_table_test.rb`                               |     2 |    2 |     0 |
| `adapters/postgresql/bit_string_test.rb`                               |     2 |    2 |     0 |
| `adapters/postgresql/virtual_column_test.rb`                           |     0 |    4 |     0 |
| `adapters/abstract_mysql_adapter/sp_test.rb`                           |     1 |    3 |     0 |
| `adapters/postgresql/utils_test.rb`                                    |     1 |    2 |     0 |
| `adapters/postgresql/numbers_test.rb`                                  |     0 |    3 |     0 |
| `connection_adapters/adapter_leasing_test.rb`                          |     0 |    3 |     0 |
| `connection_adapters/connection_swapping_nested_test.rb`               |     0 |    3 |     0 |
| `adapters/postgresql/ltree_test.rb`                                    |     1 |    2 |     0 |
| `adapters/postgresql/transaction_nested_test.rb`                       |     2 |    1 |     0 |
| `adapters/mysql2/check_constraint_quoting_test.rb`                     |     1 |    1 |     0 |
| `adapters/postgresql/statement_pool_test.rb`                           |     0 |    2 |     0 |
| `adapters/abstract_mysql_adapter/optimizer_hints_test.rb`              |     0 |    1 |     1 |
| `adapters/abstract_mysql_adapter/set_test.rb`                          |     0 |    2 |     0 |
| `adapters/postgresql/case_insensitive_test.rb`                         |     1 |    1 |     0 |
| `connection_adapters/statement_pool_test.rb`                           |     1 |    1 |     0 |
| `adapters/abstract_mysql_adapter/transaction_test.rb`                  |     0 |    2 |     0 |
| `adapters/abstract_mysql_adapter/auto_increment_test.rb`               |     0 |    2 |     0 |
| `connection_adapters/mysql_type_lookup_test.rb`                        |     2 |    0 |     0 |
| `adapters/abstract_mysql_adapter/schema_migrations_test.rb`            |     0 |    2 |     0 |
| `adapters/abstract_mysql_adapter/mysql_enum_test.rb`                   |     0 |    2 |     0 |
| `connection_adapters/standalone_connection_test.rb`                    |     0 |    2 |     0 |
| `adapters/abstract_mysql_adapter/unsigned_type_test.rb`                |     0 |    2 |     0 |
| `adapters/abstract_mysql_adapter/virtual_column_test.rb`               |     0 |    2 |     0 |
| `adapters/abstract_mysql_adapter/count_deleted_rows_with_lock_test.rb` |     1 |    1 |     0 |
| `adapters/abstract_mysql_adapter/case_sensitivity_test.rb`             |     0 |    1 |     0 |
| `adapters/postgresql/change_schema_test.rb`                            |     0 |    1 |     0 |
| `adapters/postgresql/partitions_test.rb`                               |     0 |    1 |     0 |
| `adapters/postgresql/cidr_test.rb`                                     |     0 |    1 |     0 |
| `adapters/postgresql/prepared_statements_disabled_test.rb`             |     0 |    1 |     0 |
| `connection_adapters/merge_and_resolve_default_url_config_test.rb`     |     0 |    1 |     0 |
| `adapters/postgresql/domain_test.rb`                                   |     0 |    1 |     0 |

**190 divergences** (54 assertion-count, 135 assertion-kind, 1
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
