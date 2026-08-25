---
title: "Converge DatabaseTasks dump-filename HashConfig names onto Rails' primary/alternate"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5724
claim: "2026-07-31T17:18:04Z"
assignee: "converge-database-tasks-dump-filename-configs-onto-rails-names"
blocked-by: null
closed-reason: null
---

## Context

`database-tasks.test.ts` still names schema-dump/filename `HashConfig`s
`"animals"` with a `sqlite3` adapter and an `animals.db` database
(`packages/activerecord/src/tasks/database-tasks.test.ts:217,225,1315,1330`).
Rails' `database_tasks_test.rb` never uses `animals` in this file: its
`cache_dump_filename` / `schema_dump_path` tests build
`DatabaseConfigurations::HashConfig.new("development", "primary", {})` and
`HashConfig.new("development", "alternate", {})`
(`vendor/rails/activerecord/test/cases/tasks/database_tasks_test.rb:316,325,334`),
and its lifecycle configs use the non-connecting `abstract` adapter.

PR #5716 converged the lifecycle describes onto `adapter: "abstract"` and
Rails' dash-separated database names, but deliberately left these
filename/dump tests (and the real-file drop-all fixture around
`:81-123`) alone as out of scope.

## Acceptance criteria

- `HashConfig` names in the dump/filename tests use Rails' `primary` /
  `alternate`, with expected paths updated to match.
- Any config in these tests that never connects uses `adapter: "abstract"`
  rather than `sqlite3` + a `.db` filename.
- Test names unchanged; `parity:test` for `tasks/database_tasks_test.rb`
  stays at 77/77; a run of the file leaves `git status` clean.
