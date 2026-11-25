---
title: "sqlite-connect-fails-in-read-only-db-dir"
status: draft
updated: 2026-11-25
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/application/rake/dbs.test.ts` ports
`vendor/rails/v8.0.5.2/railties/test/application/rake/dbs_test.rb`. Its test
"db:drop failure because bad permissions" (`dbs_test.rb:240-248`) runs
`db:drop` against a `DATABASE_URL` SQLite database after
`FileUtils.chmod("-w", "db")`, and expects "Couldn't drop" with exit status 1.

In trails the task stops earlier. `db:check_protected_environments`
(`checkCurrentProtectedEnvironmentBang`,
`packages/activerecord/lib/tasks/database-tasks.ts`) connects, and the first
query, `SELECT sqlite_version(*)` (`SQLite3Adapter#getDatabaseVersion`), raises
`ActiveRecord::StatementInvalid: SQLite3::ReadOnlyException: attempt to write a
readonly database`. Rails runs the same check
(`database_tasks.rb:643-658`) and reaches `SQLiteDatabaseTasks#drop`
(`sqlite_database_tasks.rb:22-30`), which raises the permission error that
`drop` reports as "Couldn't drop". Not yet traced: which part of trails'
connect (the journal mode or another pragma from `configure_connection`,
`sqlite3_adapter.rb:820-845`, or the driver's open flags) needs to write in a
read-only directory where the Ruby sqlite3 gem does not.

## Acceptance criteria

- Find where trails' SQLite connect writes in a read-only directory and Rails
  does not, citing the Rails or sqlite3-gem `file:line`.
- Converge it so `check_protected_environments` reads a database whose
  directory is read-only.
- "db:drop failure because bad permissions" passes in
  `packages/trailties/test/application/rake/dbs.test.ts`.
