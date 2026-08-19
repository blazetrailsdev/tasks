---
title: "assertion parity tail: adapters files, batch 3c"
status: done
updated: 2026-08-19
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: 6736
claim: "2026-08-19T13:00:37Z"
assignee: "assertions-tail-adapters-3c"
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
| `adapters/postgresql/interval_test.rb`                                 |     0 |    1 |     0 |
| `adapters/mysql2/mysql2_rake_test.rb`                                  |     0 |    1 |     0 |
| `connection_adapters/connection_handlers_multi_pool_config_test.rb`    |     0 |    1 |     0 |

**30 divergences** (4 assertion-count, 26 assertion-kind, 0
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
