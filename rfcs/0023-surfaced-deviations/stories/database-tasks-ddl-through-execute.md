---
title: "Route database-tasks and test-helper DDL through execute"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
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

PR #4962 routed DDL through the public `execute` (which `dirties_query_cache`
wires) everywhere in the library, matching Rails' `schema_statements.rb` call
shape, and deleted the `_writeDirtyDepth` guard.

Two trees were deliberately left on `executeMutation` to bound that PR's blast
radius:

- `packages/activerecord/src/tasks/postgresql-database-tasks.ts:97,118,250`,
  `tasks/mysql-database-tasks.ts:81,101,166-172`,
  `tasks/sqlite-database-tasks.ts:199,236,248`
- `packages/activerecord/src/test-helpers/drop-all-tables.ts:132-224`,
  `test-helpers/use-fixtures.ts:299,515`

Rails' `DatabaseTasks` run these through `connection.execute` /
`connection.drop_table` / `truncate_tables`
(`activerecord/lib/active_record/tasks/*_database_tasks.rb`), so the call shape
diverges. The practical effect is small — database-level create/drop/truncate
never runs inside a `cache` block — which is why it was scoped out rather than
rushed; but it is a real deviation and the sites are now the only remaining
`executeMutation` DDL callers outside the CRUD write path.

## Acceptance criteria

- [ ] Route the `tasks/*-database-tasks.ts` DDL/truncate sites through `execute`
      (or the schema-statement helpers where Rails uses those).
- [ ] Route `test-helpers/drop-all-tables.ts` and `use-fixtures.ts` DELETE/DROP
      sites through `execute`.
- [ ] Keep `executeMutation` on the CRUD write path (`execInsert`/`execUpdate`/
      `execDelete`), which legitimately needs affected-row counts and insert ids.
- [ ] `blazetrails/no-raw-sql` fires on `execute()` but not `executeMutation()`,
      so expect to add disables with reasons for the hand-built DDL strings.
- [ ] Fixture-heavy suites stay green; watch for the shared-DB flakes these
      helpers are implicated in.
