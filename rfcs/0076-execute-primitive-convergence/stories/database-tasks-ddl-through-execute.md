---
title: "Route the remaining database-tasks DDL/truncate sites through execute"
status: done
updated: 2026-08-09
rfc: "0076-execute-primitive-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6292
claim: "2026-08-09T19:19:19Z"
assignee: "reset-column-information-leaves-sync-readers-cold"
blocked-by: null
closed-reason: null
---

## Context

PR #4962 routed DDL through the public `execute` (which `dirties_query_cache`
wires) everywhere in the library, matching Rails' `schema_statements.rb` call
shape, and deleted the `_writeDirtyDepth` guard. Two trees were deliberately
left on `executeMutation` to bound that PR's blast radius: `tasks/*` and two
test-helper files.

**Re-verified against origin/main 2026-08-09 — most of that scope is gone:**

- `tasks/postgresql-database-tasks.ts` no longer calls `executeMutation` at
  all (purge/create route through `conn.createDatabase` etc.,
  postgresql-database-tasks.ts:48).
- `test-helpers/drop-all-tables.ts` and `test-helpers/use-fixtures.ts` no
  longer exist in the tree.

What remains is exactly four call sites, all truncate-path:

- `packages/activerecord/src/tasks/mysql-database-tasks.ts:134,137,140`
  (`SET FOREIGN_KEY_CHECKS = 0` / `TRUNCATE TABLE ...` / `SET FOREIGN_KEY_CHECKS = 1`)
- `packages/activerecord/src/tasks/sqlite-database-tasks.ts:281,293`
  (`DELETE FROM "<table>"`, `DELETE FROM sqlite_sequence WHERE name IN (...)`)

Rails' `DatabaseTasks` run these through `connection.execute` /
`truncate_tables` (`activerecord/lib/active_record/tasks/*_database_tasks.rb`),
so the call shape still diverges. The practical effect is small — database-level
truncate never runs inside a `cache` block — but these are now the only
remaining `executeMutation` DDL/DML callers outside the CRUD write path.

## Acceptance criteria

- [ ] Route the five `tasks/mysql-database-tasks.ts` and
      `tasks/sqlite-database-tasks.ts` sites above through `execute` (or the
      schema-statement helpers where Rails uses those).
- [ ] Keep `executeMutation` on the CRUD write path (`execInsert`/`execUpdate`/
      `execDelete`), which legitimately needs affected-row counts and insert ids.
- [ ] `blazetrails/no-raw-sql` fires on `execute()` but not `executeMutation()`,
      so expect to add disables with reasons for the hand-built DDL strings.
- [ ] `mysql-database-tasks.trails.test.ts`, `sqlite-database-tasks*.trails.test.ts`
      and the truncate suites stay green on the MySQL lane.
