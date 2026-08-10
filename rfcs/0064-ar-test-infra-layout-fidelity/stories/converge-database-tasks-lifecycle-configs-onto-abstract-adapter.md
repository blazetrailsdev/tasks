---
title: "DatabaseTasks lifecycle tests use invented sqlite3 configs where Rails uses the abstract adapter"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5716
claim: "2026-07-31T15:57:05Z"
assignee: "converge-database-tasks-lifecycle-configs-onto-abstract-adapter"
blocked-by: null
closed-reason: null
---

## Context

Rails' `database_tasks_test.rb` configures every DatabaseTasks lifecycle
describe with the non-connecting abstract adapter and dash-separated database
names: `{ "adapter" => "abstract", "database" => "my-db" }`
(`vendor/rails/activerecord/test/cases/tasks/database_tasks_test.rb:748`),
`"dev-db"` / `"test-db"` / `"secondary-dev-db"` / `"secondary-test-db"`
(`:404, :493, :617, :835, :925, :1261, :1285, :1374`).

trails' port instead invented `{ adapter: "sqlite3", database: "dev.db" }` and
`test.db` / `dev_animals.db` / `test_animals.db` / `animals.db`. PR #5705
converged only `DatabaseTasksDropAllTest` onto Rails' abstract config (it was
the regression cover for the protected-environment guard removal); the
remaining describes still carry the invented sqlite3 configs:

- `DatabaseTasksCreateAllTest` (`database-tasks.test.ts:306`)
- `DatabaseTasksCreateCurrentTest` (`:380`)
- `DatabaseTasksCreateCurrentThreeTierTest` (`:456`)
- `DatabaseTasksDropCurrentTest` (`:603`)
- `DatabaseTasksDropCurrentThreeTierTest` (`:659`)
- `DatabaseTasksPurgeCurrentTest` (`:1048`)
- `DatabaseTasksPurgeAllTest` (`:1071`)
- `DatabaseTasksTruncateAllTest` (`:1093`)
- `DatabaseTasksTruncateAllWithMultipleDatabasesTest` (`:1116`)
- `DatabaseTasksCharsetTest` / `DatabaseTasksCollationTest` (`:1181`, `:1201`)

They pass today only because their registered task handlers are stubs that
never connect — nothing structurally prevents a future code path from opening
a real SQLite file in the working tree again, which is exactly the bug #5705
fixed. Rails' abstract adapter makes that impossible by construction.

Note the `registerTask` key must move with the adapter: trails registers under
`"sqlite"` and `resolveTask` matches by `adapter.startsWith(pattern)`
(`tasks/database-tasks.ts:150`), so an abstract config needs
`registerTask("abstract", ...)`.

Also converge the trails-only `animals` third-tier naming onto Rails'
`secondary` (`database_tasks_test.rb:617-622`) while in the file.

## Acceptance criteria

- Every DatabaseTasks lifecycle describe listed above uses Rails' verbatim
  `adapter: "abstract"` config and Rails' database names.
- `registerTask` keys and assertions move with them; test names unchanged.
- `parity:test` for `tasks/database_tasks_test.rb` stays at 77/77.
- A run of `packages/activerecord/src/tasks/database-tasks.test.ts` leaves
  `git status` clean (no stray `*.db`).
