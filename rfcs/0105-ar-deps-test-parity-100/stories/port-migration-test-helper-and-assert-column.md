---
title: "Port migration TestHelper and assert_column/assert_no_column instead of copying them per file"
status: draft
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails gives the migration test cluster two shared helper layers that trails
re-hand-rolls in every migration test file:

- `ActiveRecord::Migration::TestHelper`
  (`vendor/rails/activerecord/test/cases/migration/helper.rb:11-38`) — a
  `TestModel` on `test_models`, a `setup` that creates the table with
  `t.timestamps null: true` and calls `reset_column_information`, a `teardown`
  that calls `reset_table_name`, `reset_sequence_name` and drops the table, and
  a `delegate(*CONNECTION_METHODS, to: :connection)` that makes `add_column`,
  `remove_column`, `change_column`, `add_reference` and friends bare calls in
  the test bodies.
- `assert_column` / `assert_no_column`
  (`vendor/rails/activerecord/test/cases/test_case.rb:128-136`) — each does
  `model.reset_column_information` then `assert_includes` /
  `assert_not_includes` on `model.column_names`.

trails has neither. `packages/activerecord/src/migration/column-attributes.test.ts`
(added by #7256) declares `assertColumn` / `assertNoColumn` file-locally with
the Rails names and bodies, and both it and
`packages/activerecord/src/migration/columns.test.ts` open-code the helper's
`beforeEach` / `afterEach` — each fetching `ambientConnection()` again at the
top of every `it`, where Rails reads the delegated `connection` attr. The
teardown half is also incomplete in both: neither calls the
`reset_table_name` / `reset_sequence_name` that `helper.rb:32-33` does.

This is duplicated setup, not a language shortcoming — the mixin has a settled
trails idiom (`include()` / `Included<>` from `@blazetrails/activesupport`, per
CLAUDE.md "Module mixins"), and the two assertion helpers are plain functions.

## Converged shape

- A `migration/helper.ts` mirroring `helper.rb`: the `TestModel` class,
  `CONNECTION_METHODS`, and the setup/teardown pair, so a migration test file
  wires it once instead of restating it.
- `assertColumn` / `assertNoColumn` living beside the other shared test
  assertions (the `test_case.rb` counterpart), not copied per file.
- `column-attributes.test.ts` and `columns.test.ts` consume both and drop their
  local copies; the teardown regains `resetTableName` / `resetSequenceName`.

## Acceptance criteria

- `assertColumn` / `assertNoColumn` are defined once and imported, with the
  Rails bodies from `test_case.rb:128-136`.
- The migration `TestHelper` setup/teardown lives in one place mirroring
  `helper.rb:22-34`, including the `resetTableName` / `resetSequenceName` calls
  currently missing on both sides.
- `packages/activerecord/src/migration/column-attributes.test.ts` and
  `columns.test.ts` carry no file-local copy of either.
- `pnpm parity:test` stays at 0 missing for
  `migration/column_attributes_test.rb` and `migration/columns_test.rb`, and
  the assertion-mismatch ratchet does not increase.
- Green on all three adapter lanes.
