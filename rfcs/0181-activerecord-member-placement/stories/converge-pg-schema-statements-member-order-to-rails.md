---
title: "postgresql/schema-statements.ts: put class members in Rails source order"
status: ready
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts` does not follow the member order of `activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`. trails#8583 placed the members it moved in Rails order relative to their neighbours, and its review recorded the rest as pre-existing residue. Examples: `updateTableDefinition` opens the class (Rails :880); `dropTable` and `indexes` precede `createDatabase` (Rails :22, :57, :86); `columnNamesFromColumnNumbers` sits mid-file (Rails :1152, last private); `typeToSql` and `columnsForDistinct` precede `changeColumn` (Rails :830, :868 against :466); `foreignKeys` precedes `addForeignKey` (Rails :584 against :578); the private `assertValidDeferrable` / `extractForeignKeyAction` / `extractConstraintDeferrable` (Rails :1023-1039) sit among public members.

Rails order, by `def` line: 9 recreate*database, 22 create_database, 53 drop_database, 57 drop_table, 63 schema_exists?, 68 index_name_exists?, 86 indexes, 154 table_options, 175 table_comment, 190 table_partition_definition, 204 inherited_table_names, 220-240 current_database .. ctype, 245 schema_names, 256 create_schema, 269 drop_schema, 278-296 search path and client_min_messages, 301 default_sequence_name .. 412 primary_keys, 434 rename_table .. 573 index_name, 578 add_foreign_key .. 823 remove_unique_constraint, 830 type_to_sql, 868 columns_for_distinct, 880 update_table_definition, 884 create_schema_dumper, 893-926 validate*\*, 932 foreign_key_column_for, 937 add_index_options, 944 quoted_include_columns_for_index, 953 schema_creation, then private from 958.

`blazetrails/rails-file-structure-method-order` is autofixable but is not enrolled for this file (see `rails-file-structure-method-order-dormant-and-per-file`).

## Acceptance criteria

- [ ] Class members of `postgresql/schema-statements.ts` appear in the order of the Rails file. Pure reorder: no body changes.
- [ ] `pnpm parity:api:pins` and `scripts/mixin-declaration-drift.test.ts` stay green; `parity:api` totals unchanged.
- [ ] If the reorder exceeds the PR ceiling, split by Rails line range and file the remainder.
