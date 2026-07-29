---
title: "test: port columns_test.rb's remaining rename-column cases"
status: claimed
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-07-29T19:22:12Z"
assignee: "port-columns-test-rename-column-remainder"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/migration/columns.test.ts` now holds
`test_rename_column` (columns_test.rb:43-51), the rename/remove-column index
cluster (:96-155, PR #5548) and `test_change_column` (:181-204). `test:compare`
still reports 28 of 36 missing.

This story covers the rename half of the remainder:

- `test_add_rename` (:14-27)
- `test_rename_column_using_symbol_arguments` (:30-40)
- `test_rename_column_preserves_default_value_not_null` (:54-65)
- `test_mysql_rename_column_preserves_auto_increment` (:67-75, mysql-only)
- `test_rename_nonexistent_column` (:77-87, `StatementInvalid` on PostgreSQL,
  `ActiveRecordError` elsewhere)
- `test_rename_column_with_sql_reserved_word` (:89-94)
- `test_removing_and_renaming_column_preserves_custom_primary_key` (:367-379)

Setup/teardown and the `TestModel` host already exist in the file (ported from
`migration/helper.rb:16-34`); these cases only add `it` blocks.

## Acceptance criteria

- [ ] The seven cases above ported with Rails-verbatim test names, including the
      adapter branch on `test_rename_nonexistent_column` and the mysql-only gate
      on the auto-increment case.
- [ ] Green on all three adapters; `test:compare` missing count drops by 7.
