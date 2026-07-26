---
title: "converge-pg-ddl-exec-primitive-and-quoting-routing"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

Fallout cluster from the #5334 include-resolution reseed, surviving the
delegation-transparency gate added by
`burn-down-mixin-driven-wide-ratchet-expansion`. The PG DDL/mutation bodies —
ported in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`
(and `postgresql-adapter.ts` for the transaction/session ones) — build and issue
their SQL by hand rather than through the primitives Rails uses.

Baselined entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`,
anchored in
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`
(plus `postgresql_adapter.rb` for the session/transaction ones):

- Alter-table routing: `add_exclusion_constraint`, `validate_constraint` drop
  `create_alter_table` + `accept` + `execute`; `add_index` drops
  `build_create_index_definition`, `accept`, `index`, `quote_column_name`,
  `execute`; `add_unique_constraint` drops `execute`.
- `*_for_alter` builders (`add_column_for_alter`, `change_column_for_alter`,
  `change_column_null_for_alter`) drop `new` — Rails instantiates a
  ChangeColumnDefinition / AlterTable node; trails string-builds.
- Quoting: `change_column_comment`, `rename_index`, `remove_index`,
  `reset_pk_sequence!`, `set_pk_sequence!`, `primary_keys` drop
  `quote_table_name` / `quote_column_name`; `quote_default_expression` drops
  `quote`/`serialize`/`include?`; `quoted_include_columns_for_index` drops
  `add_options_for_index_columns`.
- Session/DDL statements: `create_database`, `drop_database`, `create_schema`,
  `drop_schema`, `rename_table`, `remove_index` drop `execute`;
  `client_min_messages=`, `schema_search_path=`,
  `exec_restart_db_transaction`, `exec_rollback_db_transaction` drop
  `internal_execute`; the read-side session accessors (`encoding`, `collation`,
  `ctype`, `current_database`, `current_schema`, `schema_search_path`,
  `table_comment`, `serial_sequence`, `schema_exists?`) drop `query_value`.
- Removal helpers: `remove_exclusion_constraint` / `remove_unique_constraint`
  drop `remove_constraint`; `validate_check_constraint` /
  `validate_foreign_key` drop `check_constraint_for!` / `foreign_key_for!`.

## Acceptance criteria

- Route DDL through the ported schema-creation path (`createAlterTable` +
  `accept`, `buildCreateIndexDefinition`) and the ported quoting helpers rather
  than inline template SQL, wherever the Rails body does.
- Route session reads/writes through the ported `queryValue` /
  `internalExecute` primitives.
- Every entry either drops out of
  `call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
  or gets a specific `reason` naming the equivalent path.
- `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/`.

This is larger than one PR: ship the alter-table/quoting half first and register
the session/transaction half as a follow-up story rather than exceeding 500 LOC.
