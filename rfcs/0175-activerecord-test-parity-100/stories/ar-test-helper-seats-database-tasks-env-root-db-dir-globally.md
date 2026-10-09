---
title: "activerecord: the test helper seats DatabaseTasks env / root / db_dir globally where Rails' tests stub them"
status: draft
updated: 2026-10-09
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8721 made `DatabaseTasks.env` / `root` / `dbDir` raise when nothing has assigned them and no
`Trails` is seated, as `database_tasks.rb:83-85,99-105` do. To keep the AR suite running, the test
helper now assigns all three for every test file
(`packages/activerecord/src/cases/helper.ts`: `DatabaseTasks.env = DEFAULT_ENV()`,
`DatabaseTasks.root = getOs().cwd()`, `DatabaseTasks.dbDir = "db"`).

Rails' `activerecord/test/cases/helper.rb` assigns none of them. Its tests stub the reader where a
test needs one (`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb`,
`stub(:env, ...)`, `stub(:root, ...)`, `stub(:db_dir, ...)`), and a test that reads one unstubbed
would raise `NameError`. The global seat hides which trails tests depend on a value Rails' test does
not provide.

The same PR left three trails-only tests in a Rails-named file,
`packages/activerecord/src/database-configurations.test.ts` (`describe("currentEnv resolution")`:
"currentEnv prefers TRAILS_ENV over NODE_ENV", "currentEnv falls back to NODE_ENV, then defaultEnv",
"fromEnv builds the synthesized DATABASE_URL config under currentEnv"). They now assert
`DEFAULT_ENV()` and have no counterpart in
`vendor/rails/v8.0.2/activerecord/test/cases/database_configurations_test.rb`.

`packages/activerecord/src/test-setup-dy.ts` also calls `DatabaseTasks.purge(envConfig)`, which
reaches `SQLiteDatabaseTasks`' `root = DatabaseTasks.root` default; Rails' harness does not purge
through `DatabaseTasks`.

## Acceptance criteria

- [ ] `cases/helper.ts` assigns none of `DatabaseTasks.env` / `root` / `dbDir`; each test that needs
      one stubs it where the Rails test does, and `test-setup-dy.ts` passes what its purge needs
      explicitly.
- [ ] The `currentEnv resolution` tests move to a `.trails.test.ts` file.
- [ ] `pnpm parity:test` delta non-negative.
