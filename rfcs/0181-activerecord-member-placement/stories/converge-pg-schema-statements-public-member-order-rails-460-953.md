---
title: "postgresql/schema-statements.ts: put public members Rails :460-:953 in Rails source order"
status: ready
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`converge-pg-schema-statements-member-order-rails-460-onward` moved the private tail of
`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts` into the order of
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:958-1152`
(`create_table_definition` through `column_names_from_column_numbers`): the privates now sit after every
public member, in Rails `def` order. The full `:460`-onward reorder measured 868 changed lines, over the
800 ceiling, so that story's third criterion split it; the private tail shipped as 276.

The public members after `renameTable` (Rails `:434`) are still in their old relative order:
`updateTableDefinition` (`:880`) is first, then `columnsForDistinct` (`:868`), `typeToSql` (`:830`),
`changeColumn` (`:466`), `addColumn` (`:460`), `renameColumn` (`:523`), `addIndex` (`:529`),
`buildCreateIndexDefinition` (`:538`), `removeIndex` (`:543`), `renameIndex` (`:566`), `indexName` (`:573`),
`changeColumnDefault` (`:485`), `buildChangeColumnDefinition` (`:478`),
`buildChangeColumnDefaultDefinition` (`:489`), `changeColumnNull` (`:497`), `changeColumnComment` (`:509`),
`changeTableComment` (`:516`), `createSchemaDumper` (`:884`), `validateConstraint` (`:893`),
`validateCheckConstraint` (`:926`), `validateForeignKey` (`:915`), `foreignKeyColumnFor` (`:932`),
`addIndexOptions` (`:937`), `quotedIncludeColumnsForIndex` (`:944`), `schemaCreation` (`:953`),
`foreignKeys` (`:584`), `foreignTables` (`:629`), `foreignTableExists` (`:633`), `addForeignKey` (`:578`),
`checkConstraints` (`:637`), `exclusionConstraintOptions` (`:753`), `addExclusionConstraint` (`:745`),
`removeExclusionConstraint` (`:768`), `exclusionConstraints` (`:663`), `uniqueConstraintOptions` (`:804`),
`addUniqueConstraint` (`:796`), `removeUniqueConstraint` (`:823`), `uniqueConstraints` (`:697`).

Rails order, by `def` line: 460 add_column, 466 change_column, 478 build_change_column_definition, 485
change_column_default, 489 build_change_column_default_definition, 497 change_column_null, 509
change_column_comment, 516 change_table_comment, 523 rename_column, 529 add_index, 538
build_create_index_definition, 543 remove_index, 566 rename_index, 573 index_name, 578 add_foreign_key,
584 foreign_keys, 629 foreign_tables, 633 foreign_table_exists?, 637 check_constraints, 663
exclusion_constraints, 697 unique_constraints, 745 add_exclusion_constraint, 753
exclusion_constraint_options, 768 remove_exclusion_constraint, 796 add_unique_constraint, 804
unique_constraint_options, 823 remove_unique_constraint, 830 type_to_sql, 868 columns_for_distinct, 880
update_table_definition, 884 create_schema_dumper, 893 validate_constraint, 915 validate_foreign_key, 926
validate_check_constraint, 932 foreign_key_column_for, 937 add_index_options, 944
quoted_include_columns_for_index, 953 schema_creation.

Measured against the private-tail PR: sorting these 38 blocks (each with its leading JSDoc) is a
716-line diff (358 moved lines), under the ceiling in one PR. The
`/* eslint-enable @typescript-eslint/no-unsafe-declaration-merging */` comment after `renameTable` stays
where it is.

## Acceptance criteria

- [ ] Public class members of `postgresql/schema-statements.ts` from `addColumn` through
      `schemaCreation` appear in the order of the Rails file. Pure reorder: the sorted line set of the
      file is unchanged.
- [ ] `pnpm parity:api:pins` and `scripts/mixin-declaration-drift.test.ts` stay green; `parity:api`
      totals unchanged.
