---
title: "activerecord: port database_tasks_test.rb's 25 per-adapter and dump-filename cases"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: missing-tests
packages: ["activerecord"]
deps: ["test-extractor-expands-hash-and-const-define-method-loops"]
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
(`test-extractor-expands-hash-and-const-define-method-loops`, RFC 0025, if not already). Missing, excluding
trilogy:

- "mysql2 create"
- "postgresql create"
- "sqlite3 create"
- "mysql2 drop"
- "postgresql drop"
- "sqlite3 drop"
- "mysql2 purge"
- "postgresql purge"
- "sqlite3 purge"
- "mysql2 charset"
- "postgresql charset"
- "sqlite3 charset"
- "mysql2 collation"
- "postgresql collation"
- "sqlite3 collation"
- "mysql2 structure dump"
- "postgresql structure dump"
- "sqlite3 structure dump"
- "mysql2 structure load"
- "postgresql structure load"
- "sqlite3 structure load"
- "check dump filename for ruby format"
- "check dump filename for sql format"
- "check dump filename for ruby format with non primary databases"
- "check dump filename for sql format with non primary databases"

The 8 `trilogy *` cases need a TrilogyAdapter (`activerecord-port-trilogy-adapter`, RFC 0174, blocked).

## Acceptance criteria

- [ ] Each case is ported with Rails' name, driving `DatabaseTasks` against the adapter-specific task class as Rails does.
- [ ] `database_tasks_test.rb` missing count falls to the 8 trilogy cases.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
