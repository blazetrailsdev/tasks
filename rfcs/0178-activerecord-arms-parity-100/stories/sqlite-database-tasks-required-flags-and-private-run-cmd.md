---
title: "activerecord: SQLiteDatabaseTasks takes extra_flags as required; run_cmd and run_cmd_error are private methods"
status: done
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8629
claim: "2026-10-07T14:03:11Z"
assignee: "converge-pg-schema-statements-member-order-to-rails"
blocked-by: null
closed-reason: null
---

## Context

Left in `packages/activerecord/src/tasks/sqlite-database-tasks.ts` after trails#8419, against
`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb`:

- `structure_dump(filename, extra_flags)` and `structure_load(filename, extra_flags)` (`:44`, `:60`) require
  `extra_flags`. The ports declare `extraFlags?`, and several trails tests call them with one argument.
- `run_cmd` and `run_cmd_error` are private instance methods (`:77-86`). The port exports them as top-level
  functions; `sqlite-database-tasks-run-cmd.trails.test.ts` imports `runCmd` directly.
- `structure_dump` calls `connection` twice (`:50-51`). The port holds one `const connection` local.
- `structure_dump` names `ActiveRecord::SchemaDumper.ignore_tables` (`:48`). The port dynamically imports
  `SchemaDumper` from `connection-adapters/abstract/schema-dumper.js`; the MySQL and PostgreSQL task files
  import it from `schema-dumper.js`.
- `isInMemoryDatabase` (`packages/activerecord/src/sqlite/sqlite-uri.ts`) lost its last production caller
  when the `VACUUM INTO` arm was removed. Only `sqlite3-adapter.trails.test.ts` reads it.

## Acceptance criteria

- [ ] `extraFlags` is a required parameter on both methods, and the tests pass it.
- [ ] `runCmd` and `runCmdError` are private methods of `SQLiteDatabaseTasks`, as in the MySQL task file.
- [ ] `structureDump` reads `ActiveRecord::SchemaDumper` the way the other two task files do.
- [ ] `isInMemoryDatabase` is deleted, or shown to have a Rails counterpart.
