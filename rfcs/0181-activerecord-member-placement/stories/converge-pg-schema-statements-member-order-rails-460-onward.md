---
title: "postgresql/schema-statements.ts: put class members from Rails :460 on in Rails source order"
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

`converge-pg-schema-statements-member-order-to-rails` put the class members of
`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts` in the order of
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`
for Rails `:9` (`recreate_database`) through `:434` (`rename_table`). The full reorder is a 1,606-line
diff (803 moved lines), over the PR ceiling, so the story's third criterion split it by Rails line range.

Everything from Rails `:460` on is still in its old relative order, starting right after `renameTable`.
Out of place there: `updateTableDefinition` (Rails `:880`) is the first member after `renameTable`;
`columnNamesFromColumnNumbers` (`:1152`, the last private) precedes `columnsForDistinct` (`:868`) and
`typeToSql` (`:830`), which precede `changeColumn` (`:466`); `addColumn` (`:460`) follows `changeColumn`;
`foreignKeys` (`:584`) precedes `addForeignKey` (`:578`); the private `assertValidDeferrable` /
`extractForeignKeyAction` / `extractConstraintDeferrable` (`:1023-1039`) sit among public members; the
private `exclusionConstraintName` / `exclusionConstraintFor` / `uniqueConstraintName` /
`uniqueConstraintFor` and their bang forms (`:1078-1113`) sit among the public constraint methods.

Remaining Rails order, by `def` line: 460 add_column, 466 change_column, 478
build_change_column_definition, 485 change_column_default, 489 build_change_column_default_definition,
497 change_column_null, 509 change_column_comment, 516 change_table_comment, 523 rename_column, 529
add_index, 538 build_create_index_definition, 543 remove_index, 566 rename_index, 573 index_name, 578
add_foreign_key, 584 foreign_keys, 629 foreign_tables, 633 foreign_table_exists?, 637 check_constraints,
663 exclusion_constraints, 697 unique_constraints, 745 add_exclusion_constraint, 753
exclusion_constraint_options, 768 remove_exclusion_constraint, 796 add_unique_constraint, 804
unique_constraint_options, 823 remove_unique_constraint, 830 type_to_sql, 868 columns_for_distinct, 880
update_table_definition, 884 create_schema_dumper, 893 validate_constraint, 915 validate_foreign_key, 926
validate_check_constraint, 932 foreign_key_column_for, 937 add_index_options, 944
quoted_include_columns_for_index, 953 schema_creation, then private from 958 in `def` order through 1152
column_names_from_column_numbers.

Measured on the merged prefix: reordering the rest is about 500 moved lines (a ~1,000-line diff), so it
needs two PRs. Moving only the private tail (Rails `:958-1152`) into place is ~280 moved lines; the
public `:460-:953` range is the rest.

## Acceptance criteria

- [ ] Class members of `postgresql/schema-statements.ts` from `addColumn` on appear in the order of the
      Rails file. Pure reorder: the sorted line set of the file is unchanged.
- [ ] `pnpm parity:api:pins` and `scripts/mixin-declaration-drift.test.ts` stay green; `parity:api`
      totals unchanged.
- [ ] If the reorder exceeds the PR ceiling, ship the private tail (`:958-1152`) first and file the
      public `:460-:953` range.
