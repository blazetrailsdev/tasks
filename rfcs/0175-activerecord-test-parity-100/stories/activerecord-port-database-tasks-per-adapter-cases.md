---
title: "activerecord: port database_tasks_test.rb's 25 per-adapter and dump-filename cases"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: missing-tests
packages: ["activerecord"]
deps:
  [
    "parity-100-rehome-postponed-rfc-dependencies",
    "test-extractor-expands-hash-and-const-define-method-loops",
  ]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tasks/database_tasks_test.rb → tasks/database-tasks.test.ts` 77/109. Rails generates most of the missing
cases with `ADAPTERS_TASKS.each do |k, v| define_method("test_#{k}_create") …` loops
(`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb`); the TS extractor expands such loops
(`test-extractor-expands-hash-and-const-define-method-loops`, RFC 0025, if not already). Missing:

- "mysql2 create"
- "trilogy create"
- "postgresql create"
- "sqlite3 create"
- "mysql2 drop"
- "trilogy drop"
- "postgresql drop"
- "sqlite3 drop"
- "mysql2 purge"
- "trilogy purge"
- "postgresql purge"
- "sqlite3 purge"
- "mysql2 charset"
- "trilogy charset"
- "postgresql charset"
- "sqlite3 charset"
- "mysql2 collation"
- "trilogy collation"
- "postgresql collation"
- "sqlite3 collation"
- "mysql2 structure dump"
- "trilogy structure dump"
- "postgresql structure dump"
- "sqlite3 structure dump"
- "mysql2 structure load"
- "trilogy structure load"
- "postgresql structure load"
- "sqlite3 structure load"
- "check dump filename for ruby format"
- "check dump filename for sql format"
- "check dump filename for ruby format with non primary databases"
- "check dump filename for sql format with non primary databases"

The 7 `trilogy *` cases are in scope and port like any other row: they only assert that
`DatabaseTasks` routes the `"trilogy"` adapter string to `MySQLDatabaseTasks`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:79`, which trails already
registers at `packages/activerecord/src/tasks/mysql-database-tasks.ts:173`), with the task object
stubbed. No Trilogy client is constructed, so trails having no `TrilogyAdapter` does not reach them.

## Acceptance criteria

- [ ] Each case is ported with Rails' name, driving `DatabaseTasks` against the adapter-specific task class as Rails does.
- [ ] `database_tasks_test.rb` missing count falls to 0, the 7 `trilogy *` cases included.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
