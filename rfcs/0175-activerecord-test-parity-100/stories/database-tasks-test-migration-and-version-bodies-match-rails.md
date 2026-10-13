---
title: "activerecord: database-tasks.test.ts migration, target-version and register-task bodies match database_tasks_test.rb"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`database-tasks-test-remaining-bodies-match-rails` ported the stubbed-configuration
describes of `packages/activerecord/src/tasks/database-tasks.test.ts` onto
`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb` and
stopped at the PR size ceiling. What is left in the file:

- `DatabaseTasksMigrationTestCase` (`database_tasks_test.rb:1029-1059`). The
  trails `databaseTasksMigrationTestCase` still spies on `stdout.write` with
  `vi.spyOn` where Rails' `capture_migration_output` is
  `capture(:stdout) { DatabaseTasks.migrate }` (`capture` is exported from
  `@blazetrails/activesupport`, `packages/activesupport/src/testing/stream.ts`),
  and its teardown is `Base.removeConnection()` in a `try`/`catch` where Rails
  has `@conn.release_connection if @conn` and `establish_connection :arunit`.
- The setup copies the file database into `:memory:` with the hand-written
  `backupIntoConnection` ATTACH-and-copy helper, where Rails uses
  `SQLite3::Backup.new(dest_db, "main", source_db, "main")`, `step(-1)`,
  `finish` (`:1040-1044`). No trails driver wrapper exposes a backup into an
  open in-memory handle: `packages/activerecord/src/sqlite/better-sqlite3.ts`,
  `node-sqlite.ts` and `libsql.ts` each have a file-to-file `backup` only.
- `DatabaseTasksMigrateTest` and `DatabaseTasksMigrateScopeTest`
  (`:1061-1161`) save and restore `VERBOSE` / `VERSION` / `SCOPE` in
  `beforeEach` / `afterEach` through `process.env`, where each Rails body
  reads them first and restores them in its own `ensure`. `getEnv` / `setEnv`
  are the trails spelling.
- `DatabaseTasksMigrateStatusTest` (`:1163-1186`) creates the table in a hook
  and matches `/down\s+001\s+…/`; Rails assigns `@schema_migration` in
  `setup`, calls `create_table` and `delete_all_versions` in the body, has a
  private `capture_migration_status`, and matches the literal column spacing.
- `DatabaseTaskTargetVersionTest` and `DatabaseTaskCheckTargetVersionTest`
  (`:1540-1646`) restore `VERSION` in hooks where each Rails body has
  `version = ENV["VERSION"]` and an `ensure`.
- `DatabaseTasksCheckSchemaFileTest` (`:1683-1689`) spies on the process
  adapter where Rails has `assert_called_with(Kernel, :abort, [/awesome-file.sql/])`.
- `DatabaseTasksRegisterTask` (`:224-271`) uses `vi.fn` instances where Rails
  has `klazz.stub(:new, instance)` and `assert_called_with(instance, :structure_dump, …)`.
- `captureStdoutAndStderr` is a `vi.spyOn` pair standing in for
  `DatabaseTasksSetupper#setup`'s `$stdout, @original_stdout = StringIO.new, $stdout` (`:26-32`).

## Acceptance criteria

- [ ] Each describe listed above has the Rails body line for line, with
      `capture_migration_output` and `capture_migration_status` ported under
      their Rails names and bodies.
- [ ] `backupIntoConnection` is gone: the setup is `SQLite3::Backup`'s three
      calls against a ported backup primitive, or the story is blocked on the
      driver work with that named.
- [ ] No `vi.` call and no `process.` reference remains in the file.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
