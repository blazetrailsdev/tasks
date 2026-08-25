---
title: "sqlite3-add-column-reimplements-super"
status: done
updated: 2026-08-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6087
claim: "2026-08-04T20:20:03Z"
assignee: "i18n-date-parse-answers-a-hash-never-null"
blocked-by: null
closed-reason: null
---

## Context

Rails' SQLite3 `add_column`
(vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:338-347)
handles only the `invalid_alter_table_type?` case itself and otherwise falls
through to `super` — the abstract `SchemaStatements#add_column`
(abstract/schema_statements.rb) which routes through
`build_add_column_definition` -> `create_alter_table` -> `AlterTable#add_column`
-> `TableDefinition#new_column_definition` -> `create_column_definition`.

trails' override
(packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1675-1707)
never calls super: after the `isInvalidAlterTableType` branch it builds the
`ALTER TABLE ... ADD COLUMN` string itself, reimplementing the collation,
generated-as, NOT NULL and DEFAULT clauses that
`SchemaCreation#add_column_options!` already produces.

Consequences:

- The column-option `assert_valid_keys` guard in `createColumnDefinition`
  (schema_definitions.rb:593-599, ported in PR #6079) never fires on SQLite,
  because the definition object is never built. This is why the
  `add_column` arm of `test_add_column_with_invalid_options`
  (vendor/rails/activerecord/test/cases/migration/invalid_options_test.rb:64-86)
  is still unported.
- Every future change to `add_column_options!` has to be made twice.

## Acceptance criteria

- [ ] SQLite3 `addColumn` keeps only the `isInvalidAlterTableType` branch and
      delegates the rest to the abstract implementation, matching
      sqlite3_adapter.rb:338-347.
- [ ] The hand-rolled clause building is deleted, not duplicated.
- [ ] The `add_column` arm of `test_add_column_with_invalid_options` is ported
      (its `add_index`-option half stays out until add_index option validation
      lands) and passes on all three lanes with no adapter gate, since Rails
      applies none.
