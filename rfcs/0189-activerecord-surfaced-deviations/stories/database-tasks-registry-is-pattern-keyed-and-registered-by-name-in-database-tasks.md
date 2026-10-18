---
title: "activerecord: DatabaseTasks registry is a pattern-keyed Hash whose built-in rows are registered by name in database_tasks.rb"
status: closed
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Operator triage 2026-10-18 (RFC 0189 refine): all parity axes at 100%; this is structural/shape fidelity with no user-observable behavior change — not worth pursuing. Closed as won't-fix."
---

## Context

Rails keeps the adapter-task registry in `DatabaseTasks` itself
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:72-80`):

- `register_task(pattern, task)` is `@tasks ||= {}; @tasks[pattern] = task`, a Hash keyed by the
  pattern, so registering an equal pattern again replaces the row in place.
- The four built-in rows are registered in `database_tasks.rb:77-80`, by constant NAME
  (`"ActiveRecord::Tasks::MySQLDatabaseTasks"`), and `class_for_adapter` (`:574-580`) resolves a
  String with `task.constantize` at call time. The PostgreSQL pattern is `/postgresql/`.

trails (`packages/activerecord/src/tasks/database-tasks.ts:99-127`) differs on each point:

- `_registeredTasks` is an array of `{ pattern, handler }` and `registerTask` pushes, so a repeated
  pattern appends a second row. The field name is not Rails' `@tasks`.
- The built-in rows are registered at the bottom of each adapter file, by class reference
  (`mysql-database-tasks.ts:157-158`, `postgresql-database-tasks.ts:193`,
  `sqlite-database-tasks.ts:126`), so `DatabaseTasks` supports an adapter only if something imported
  that file. `classForAdapter` has no String arm.
- The PostgreSQL pattern is `/postgres/`, not `/postgresql/`.

Surfaced on trails#8799: the test helper `resetRegisteredTasks`
(`packages/activerecord/src/test-helpers/registered-tasks.ts`) has to import the three adapter files
and snapshot the registry to restore the built-in rows, a helper Rails' test has no counterpart for
(`activerecord/test/cases/tasks/database_tasks_test.rb:224-271` registers `/abstract/` and never
unregisters).

## Acceptance criteria

- [ ] The registry is a pattern-keyed map named `tasks`, and `registerTask` replaces the row for an
      equal pattern as `@tasks[pattern] = task` does.
- [ ] The four built-in rows are registered in `database-tasks.ts`, in Rails' order with Rails'
      patterns (`/postgresql/` included), by name; `classForAdapter` resolves a String at call time
      through the `ActiveRecord.Tasks` namespace seat (CLAUDE.md § "Call-time constant resolution")
      and keeps the `task.is_a?(String)` arm. The per-file `registerTask` calls are deleted.
- [ ] `test-helpers/registered-tasks.ts` is deleted, or reduced to what Rails' test does; the
      `tasks/` tests pass without snapshotting the registry.
