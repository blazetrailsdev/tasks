---
title: "database-tasks-root-and-db-dir-default-to-rails-root"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
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

`DatabaseTasks.root` and `DatabaseTasks.dbDir`
(`packages/activerecord/src/tasks/database-tasks.ts`) default to the process
cwd and to the relative `"db"`. Rails defaults both to the booted application:

- `DatabaseTasks#db_dir` (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:83-85`):
  `@db_dir ||= Rails.application.config.paths["db"].first`, an absolute path.
- `DatabaseTasks#root` (`database_tasks.rb:99-101`): `@root ||= Rails.root`.

So `schemaDumpPath` returns `db/schema.ts` relative to cwd, and
`schemaUpToDate` (`File.isExist(file)`) answers `true` for an app whose tests do
not run from its root: `Migration.maintainTestSchemaBang` then never loads the
schema. `boot-app-test-help.trails.test.ts` (trails#test-help-per-test-fixture-lifecycle)
works around it by assigning `DatabaseTasks.root` / `DatabaseTasks.dbDir` before
importing the app's `test/test-helper.ts`.

`Rails.application.config.paths` is async in trails (`Engine#paths`), and
activerecord reaches the application only through `TopLevel.Trails`, so the
reader needs a warm/seat design rather than a direct port.

## Acceptance criteria

- `DatabaseTasks.dbDir` falls back to the application's `paths["db"].first` and
  `DatabaseTasks.root` to `Trails.root`, with the cwd fallback kept only where
  no application is booted.
- The two assignments in `boot-app-test-help.trails.test.ts`'s `beforeAll` are
  deleted and the suite still passes.
