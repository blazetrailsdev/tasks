---
title: "activerecord: MySQL and PostgreSQL DatabaseTasks take extra_flags as required; run_cmd_error is a private method"
status: draft
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8629 converged `packages/activerecord/src/tasks/sqlite-database-tasks.ts` on two shapes the MySQL
and PostgreSQL task files still deviate on.

- `structure_dump(filename, extra_flags)` and `structure_load(filename, extra_flags)` require
  `extra_flags` (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/mysql_database_tasks.rb:40,59`,
  `postgresql_database_tasks.rb:46,80`). `mysql-database-tasks.ts` and `postgresql-database-tasks.ts`
  declare `extraFlags?`.
- `run_cmd_error` is a private instance method (`mysql_database_tasks.rb:113`,
  `postgresql_database_tasks.rb:123`). Both ports export it as a top-level `runCmdError` function tagged
  `@internal`; `runCmd` is already a private method in each.
- Both `structureDump` bodies annotate `let ignoreTables: (string | RegExp)[]`. The SQLite port dropped
  the annotation in trails#8629 with no type error.

## Acceptance criteria

- [ ] `extraFlags` is a required parameter on `structureDump` and `structureLoad` in both files, and
      every caller and test passes it.
- [ ] `runCmdError` is a private method of `MySQLDatabaseTasks` and of `PostgreSQLDatabaseTasks`, called
      as `this.runCmdError(cmd, args, action)`; any test importing the function reaches it through an
      instance.
- [ ] `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` stay green.
