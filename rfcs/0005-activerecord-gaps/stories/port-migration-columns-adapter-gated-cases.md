---
title: "port-migration-columns-adapter-gated-cases"
status: in-progress
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5569
claim: "2026-07-29T03:35:45Z"
assignee: "port-migration-columns-adapter-gated-cases"
blocked-by: null
closed-reason: null
---

## Context

PR #5560 took `packages/activerecord/src/migration/columns.test.ts` from 2 to
25 ported cases. `test:compare` still reports **11 missing** for
`vendor/rails/activerecord/test/cases/migration/columns_test.rb`. This story
covers the adapter-gated remainder, which PR #5560 deliberately left out
because every case it ported is unconditional in Rails.

- `test_mysql_rename_column_preserves_auto_increment` (`columns_test.rb:69-76`)
  — wrapped in `if current_adapter?(:Mysql2Adapter, :TrilogyAdapter)`; asserts
  `auto_increment?` on the reflected column after renaming `id` to `id_test`,
  with an `ensure` renaming it back.
- `test_change_column_default_preserves_existing_column_default_function`
  (`columns_test.rb:266-277`) — `skip unless current_adapter?(:SQLite3Adapter)`;
  drives `change_column_default` with a `-> { "CURRENT_TIMESTAMP" }` proc and
  reads `columns_hash[...].default_function`.
- `test_change_column_default_supports_default_function_with_concatenation_operator`
  (`columns_test.rb:279-285`) — same SQLite gate, proc default
  `-> { "('Ruby ' || 'on ' || 'Rails')" }`, asserts the stored
  `default_function` is `'Ruby ' || 'on ' || 'Rails'`.
- `test_change_column_null_does_not_change_default_functions`
  (`columns_test.rb:311-322`) — `skip unless current_adapter?(:Mysql2Adapter,
:TrilogyAdapter) && supports_default_expression?`; branches on
  `connection.mariadb?` for the expected function text.

The file already carries the `TestModel` / `beforeEach` / `afterEach` mirroring
`Migration::TestHelper` (`migration/helper.rb:16-34`), plus an
`indexNames()` helper. `currentAdapter()` lives in
`packages/activerecord/src/support/adapter-helper.ts` and the
`supports_default_expression?` key in `packages/activerecord/src/support/supports.ts`.
The MySQL `isMariadb()` / `databaseVersion` accessors are on
`connection-adapters/abstract-mysql-adapter.ts:448,458`.

Note the proc-default form (`-> { ... }`) may not be supported by trails'
`changeColumnDefault` yet — check
`connection-adapters/abstract/schema-statements.ts:670` before porting, and
implement the function-default path if it is missing rather than weakening the
assertions.

## Acceptance criteria

- [ ] The four adapter-gated cases above are ported under
      `Migration > ColumnsTest` with names matching Rails verbatim.
- [ ] Gates match Rails exactly — 0 gate-mismatch, 0 misplaced in `test:compare`.
- [ ] `test:compare` missing for `migration/columns_test.rb` drops by 4.
- [ ] Green on all three lanes.
