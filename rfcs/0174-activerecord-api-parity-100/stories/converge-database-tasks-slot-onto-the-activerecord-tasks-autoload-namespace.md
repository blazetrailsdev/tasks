---
title: "activerecord: tasks/database-tasks-slot.ts converges onto an ActiveRecord::Tasks Autoload namespace"
status: ready
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Owner ruling, 2026-10-08 (blocked-story triage, decision 15): the two remaining
slot modules are debt and converge onto the `ActiveRecord` Autoload namespace.

`packages/activerecord/src/tasks/database-tasks-slot.ts` holds `DatabaseTasks`
in a zero-import slot (`_setDatabaseTasks`, trails#7990). Its reader is
`migration.ts`, for `ActiveRecord::Tasks::DatabaseTasks`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:151-183,696,750,1037-1041,1361-1365`).
`database-tasks.ts` imports `migration.ts` and `connection-handling.ts`, so a
plain import back re-enters the `schema-statements.ts ->
migration/command-recorder.ts -> migration.ts` cycle.

Rails autoloads it from `active_record.rb:173-180` (`module Tasks`,
`extend ActiveSupport::Autoload`, `autoload :DatabaseTasks`).

## Acceptance criteria

- `ActiveRecord.Tasks` is a namespace object extended with `Autoload`,
  `DatabaseTasks` is autoloaded on it and seated by `database-tasks.ts`, and
  `migration.ts` reads `ActiveRecord.Tasks.DatabaseTasks` at call time.
- `tasks/database-tasks-slot.ts` is deleted.
- A plain-node import of the built `dist/` modules with `migration.js` and
  `tasks/database-tasks.js` each as the entry module does not throw.
- trails CLAUDE.md § "Call-time constant resolution" drops the
  `database-tasks-slot.ts` bullet and its "Two instances exist" sentence.
