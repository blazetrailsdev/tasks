---
title: "activerecord: tasks run_cmd goes through Kernel.system with the parent's stdio"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8732
claim: "2026-10-09T22:09:41Z"
assignee: "preserve-original-encrypted-skips-its-column-check-on-a-cold-schema-cache"
blocked-by: null
closed-reason: null
---

## Context

`MySQLDatabaseTasks#run_cmd` and `PostgreSQLDatabaseTasks#run_cmd` are
`fail run_cmd_error(cmd, args, action) unless Kernel.system(cmd, *args)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/mysql_database_tasks.rb:104-106`,
`postgresql_database_tasks.rb:116-118`). `Kernel.system` runs the child with the parent's stdio, so
`mysqldump` / `pg_dump` / `psql` errors land on the terminal and `run_cmd_error`'s "check the output
above" refers to them.

trails' ports (`packages/activerecord/src/tasks/mysql-database-tasks.ts#runCmd`,
`postgresql-database-tasks.ts#runCmd`) call `ChildProcessAdapter#spawnSync`, which pipes the child's
output, and then write the captured `stdout` / `stderr` through to the parent's streams — two `write`
calls Rails does not make, receipted `@inventedArm write — CONVERGEABLE` against this story.
`SQLiteDatabaseTasks`' `run_cmd` (`sqlite_database_tasks.rb:72-74`) uses the same `spawnSync` with an
`out:` redirect and drops the child's stderr.

`ChildProcessAdapter#system` (`packages/ruby-compat/src/child-process-adapter.ts`) already runs with the
parent's stdio, but takes a shell command string, not `Kernel.system`'s argv form, and has no `out:`.

## Acceptance criteria

- [ ] ruby-compat ports `Kernel#system` in its argv form (`cmd, *args`, an env hash first, `out:`), with
      the parent's stdio, returning Ruby's `true` / `false` / `nil`.
- [ ] The three `run_cmd` bodies are `if (!(await system(...))) throw …` with no `write` call; the
      `@inventedArm write` receipts are deleted.
- [ ] The rake tests assert on `system`, as Rails' assert on `Kernel.system`.
