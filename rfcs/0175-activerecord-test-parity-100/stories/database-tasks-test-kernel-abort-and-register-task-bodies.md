---
title: "activerecord: check_schema_file stubs Kernel.abort and register_task precedence takes Rails' body in database-tasks.test.ts"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8874
claim: "2026-10-13T21:42:23Z"
assignee: "database-tasks-test-kernel-abort-and-register-task-bodies"
blocked-by: null
closed-reason: null
---

## Context

`database-tasks-test-migration-and-version-bodies-match-rails` removed every `vi.` call
from `packages/activerecord/src/tasks/database-tasks.test.ts`. Three bodies still differ
from `vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb` because
the seam Rails stubs does not exist in trails:

- `DatabaseTasksCheckSchemaFileTest` (`database_tasks_test.rb:1683-1689`) is
  `assert_called_with(Kernel, :abort, [/awesome-file.sql/])`. trails' `abort` is a free
  function exported by `packages/ruby-compat/src/process-adapter.ts`, and
  `DatabaseTasks.checkSchemaFile` (`packages/activerecord/src/tasks/database-tasks.ts`)
  imports it by name, so there is no `Kernel` receiver to stub. The test stubs the process
  adapter's `setExitCode`, asserts on `stderr.write`, and swallows the `SystemExit` in a
  `try` / `catch`, three things the Rails body does not do.
- `DatabaseTasksRegisterTask#test_register_task_precedence` (`:251-264`) registers
  `"custom_mysql"` through `ActiveRecord::ConnectionAdapters.register` and dumps with
  `"adapter" => :custom_mysql`; the trails body registers `/abstract/` twice. Its
  `setup` / `teardown` (`:225-233`) save and restore `DatabaseTasks`' `@tasks` and
  `ConnectionAdapters`' `@adapters`; trails calls `resetRegisteredTasks()` and has no way
  to restore the module-private `adapters` map in `packages/activerecord/src/connection-adapters.ts`.
- `test_unregistered_task` (`:266-270`) asserts `structure_dump("adapter" => "abstract")`
  raises `DatabaseNotSupported`; the trails body calls the private `classForAdapter`.

`klazz.stub(:new, instance)` is spelled with a class whose constructor returns the
instance (`stubbedNew`), since trails has no static `new` (CLAUDE.md § "A record is built
with `new Klass` only"). That part is settled and is not in scope here.

## Acceptance criteria

- [ ] `check schema file` is `assertCalledWith(Kernel, "abort", [/awesome-file.sql/], …)`
      around `DatabaseTasks.checkSchemaFile("awesome-file.sql")`, with `abort` reached
      through a receiver the test can stub, and no `try` / `catch`.
- [ ] `register task precedence` and `unregistered task` have the Rails bodies, and the
      describe's hooks save and restore both registries as `:225-233` does.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
