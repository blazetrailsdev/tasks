---
title: "test: port columns_test.rb's add/remove-column tail incl. single-statement assertions"
status: ready
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The last unported slice of
`vendor/rails/activerecord/test/cases/migration/columns_test.rb` after the
rename (#5548) and change_column stories — the add/remove-column tail:

- `test_remove_column_no_second_parameter_raises_exception` (:363-365)
- `test_column_with_index` (:381-389)
- `test_add_column_without_column_name` (:391-400)
- `test_remove_columns_single_statement` (:402-420, `assert_queries_match` on a
  single multi-column `ALTER TABLE`; the SQLite arm rebuilds instead)
- `test_add_timestamps_single_statement` (:422-440, same single-statement
  assertion for `add_timestamps`)

The last two are the substantive ones: they pin that `remove_columns` and
`add_timestamps` emit ONE statement rather than N. Note
[[project_ported_tests_drop_assert_queries_count_become_noops]] — the
`assert_queries_match` assertion is the whole point of both cases and must be
ported, not dropped.

Setup/teardown and the `TestModel` host already exist in
`packages/activerecord/src/migration/columns.test.ts`.

## Acceptance criteria

- [ ] The five cases above ported with Rails-verbatim test names.
- [ ] `test_remove_columns_single_statement` and
      `test_add_timestamps_single_statement` keep a real query-shape assertion
      (via `assertQueriesMatch`), not a bare behavioural check.
- [ ] Green on all three adapters; `test:compare` missing count drops by 5.
