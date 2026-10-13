---
title: "activerecord: the remaining database-tasks.test.ts bodies match database_tasks_test.rb"
status: claimed
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: "2026-10-13T18:59:41Z"
assignee: "database-tasks-test-remaining-bodies-match-rails"
blocked-by: null
closed-reason: null
---

## Context

`database-tasks-test-bodies-match-rails` ported part of
`packages/activerecord/src/tasks/database-tasks.test.ts` onto the bodies of
`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb` and
stopped at the PR size ceiling. That PR exported Minitest's `Object#stub` as
`stub` from `@blazetrails/activesupport`
(`packages/activesupport/src/testing/method-call-assertions.ts`,
`vendor/minitest/v5.27.0/lib/minitest/mock.rb:286-326`); it restores a getter
such as `DatabaseTasks.dbDir` and takes a value or a callable. The describes
below still carry the old bodies:

- `DatabaseTasksCheckProtectedEnvironmentsMultiDatabaseTest` (`:156-222`)
  writes `ar_internal_metadata` and `schema_migrations` with raw SQL through
  two `BetterSQLite3Adapter` handles, where Rails has
  `with_multi_db_configurations(env)`, `establish_connection(:primary)` /
  `(:secondary)` and `internal_metadata.create_table_and_set_flags(current_env)`.
- `DatabaseTasksCreateCurrentThreeTierTest` (`:611-730`) spies on
  `Base.establishConnection` in `beforeEach`; Rails wraps each body in
  `with_stubbed_configurations_establish_connection` (`:722-729`).
- `DatabaseTasksDropAllTest`, `DatabaseTasksDropCurrentTest`,
  `DatabaseTasksDropCurrentThreeTierTest` (`:746-1027`) and
  `DatabaseTasksTruncateAllWithMultipleDatabasesTest` (`:1370-`) set
  `Base.configurations` in `beforeEach` and spy with `vi.spyOn`; Rails has
  `with_stubbed_configurations` (`:820-827`), `assert_called` /
  `assert_not_called` / `assert_called_with`, and an `old_env` / `ensure` pair
  around each `RAILS_ENV` write. The file-level `afterEach` that restores
  `TRAILS_ENV` goes once every body restores it itself.
- `assert_called_for_configs` (`:44-50`) is a `vi.spyOn` loop; Rails builds a
  `Minitest::Mock`, expects one `call` per config and stubs the method with it.
  `Mock` is module-private in `method-call-assertions.ts`.
- `DatabaseTasksMigrationTestCase` (`:1029-1059`) is the hand-written
  `backupIntoConnection` ATTACH-and-copy helper where Rails uses
  `SQLite3::Backup`, and the `Migrate*` describes save and restore `VERBOSE` /
  `VERSION` / `SCOPE` in hooks where each Rails body does it in an `ensure`.
- `DatabaseTasksPurgeCurrentTest`, `DatabaseTasksPurgeAllTest`, the
  `charset current` / `collation current` tests and
  `DatabaseTasksCheckSchemaFileMethods` use `vi.spyOn` and hook-level
  configuration swaps.
- `DatabaseTasksTruncateAllTest` (`:1300-1368`) seeds a temp SQLite file with
  raw SQL where Rails uses `fixtures :courses, :colleges`, `ARUnit2Model`'s
  pool and `DatabaseTasks.stub(:root, nil)`. The file carries four
  `eslint-disable-next-line blazetrails/require-table-teardown` lines for the
  raw `CREATE TABLE`s in this test and the multi-database one.
- The tests pass a plain string where Rails passes
  `ActiveSupport::StringInquirer.new("test")`; `createCurrent` / `dropCurrent`
  / `truncateAll` are typed `string | EnvironmentInquirer`.

## Acceptance criteria

- [ ] Each describe listed above has the Rails body line for line, with
      `with_stubbed_configurations`, `with_multi_db_configurations`,
      `assert_called_for_configs` and `capture_migration_output` ported under
      their Rails names and bodies.
- [ ] No `vi.spyOn` on `DatabaseTasks` or `Base` remains in the file, and the
      file-level `TRAILS_ENV` `afterEach` is gone.
- [ ] The four `require-table-teardown` disables are gone.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
