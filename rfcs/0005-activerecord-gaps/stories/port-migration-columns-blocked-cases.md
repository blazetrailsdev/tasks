---
title: "port-migration-columns-blocked-cases"
status: done
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5571
claim: "2026-07-29T03:55:46Z"
assignee: "port-migration-columns-blocked-cases"
blocked-by: null
closed-reason: null
---

## Context

PR #5560 took `packages/activerecord/src/migration/columns.test.ts` from 2 to
25 ported cases. Of the 11 `parity:test` cases still missing for
`vendor/rails/activerecord/test/cases/migration/columns_test.rb`, four are
adapter-gated (tracked by `port-migration-columns-adapter-gated-cases`) and
these seven are unconditional but each blocked on machinery PR #5560 did not
want to grow into:

- `test_change_column_null_false` (`columns_test.rb:287-294`) — asserts
  `ActiveRecord::NotNullViolation` from `TestModel.create!(first_name: nil)`
  after `change_column_null ..., false`.
- `test_change_column_null_true` (`columns_test.rb:296-302`) — uses
  `assert_difference("TestModel.count" => 1)`, which trails has no port of.
- `test_change_column_null_with_non_boolean_arguments_raises`
  (`columns_test.rb:304-309`) — asserts the exact `ArgumentError` message
  `change_column_null expects a boolean value (true for NULL, false for NOT
NULL). Got: {from: true, to: false}`; check
  `connection-adapters/abstract/schema-statements.ts:697` emits that string
  before porting, and fix the implementation if it does not.
- `test_remove_column_no_second_parameter_raises_exception`
  (`columns_test.rb:324-326`) — `connection.remove_column("funny")` raises
  Ruby's arity `ArgumentError`. TypeScript has no arity check, so this needs a
  deliberate decision about how (or whether) to mirror it.
- `test_removing_and_renaming_column_preserves_custom_primary_key` is already
  ported; `test_add_column_without_column_name` (`columns_test.rb:349-357`) is
  not — it needs the `Missing column name(s) for timestamp` `ArgumentError`
  raised by a bare `t.timestamp` in a `create_table` block. Grep confirms trails
  emits no such message today, so the `TableDefinition` column-name guard has to
  be ported first (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb`).
- `test_remove_columns_single_statement` (`columns_test.rb:359-375`) and
  `test_add_timestamps_single_statement` (`columns_test.rb:377-392`) both wrap
  the call in `assert_queries_count(current_adapter?(:SQLite3Adapter) ? 14 : 1)`.
  Porting them without a real query-count assertion turns them into no-ops, so
  they need trails' `assertQueriesCount` equivalent wired up.

The file already carries the `TestModel` / `beforeEach` / `afterEach` mirroring
`Migration::TestHelper` (`migration/helper.rb:16-34`), an `indexNames()` helper
and a `currentAdapter()` import.

## Acceptance criteria

- [ ] The seven cases above are ported under `Migration > ColumnsTest` with
      names matching Rails verbatim, together with whatever implementation or
      test-helper work each one needs — no weakened assertions, no no-op bodies.
- [ ] `parity:test` missing for `migration/columns_test.rb` reaches 0 once this
      and `port-migration-columns-adapter-gated-cases` both land; 0
      gate-mismatch, 0 misplaced.
- [ ] Green on all three lanes.
- [ ] Split across PRs under the 500-LOC ceiling if needed.
