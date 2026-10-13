---
title: "activerecord: the canonical test schema lays schema_migrations as Schema.define does"
status: in-progress
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8860
claim: "2026-10-13T14:12:27Z"
assignee: "activerecord-relocate-ts-only-tests-associations-has-many"
blocked-by: null
closed-reason: null
---

## Context

Found while removing the helper's `DatabaseTasks` seats in trails#8816.

Rails' test database has a `schema_migrations` table: `test/schema/schema.rb` is loaded through `ActiveRecord::Schema.define`, whose `define` creates it. So in `DatabaseTasksMigrationTestCase` (`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb:1029-1060`) and `test_migrate_clears_schema_cache_afterward` (`:1236-1240`), `DatabaseTasks.migrate` -> `initialize_database` (`activerecord/lib/active_record/tasks/database_tasks.rb:652-669`) finds the database already initialized and never calls `schema_dump_path`, which would read `db_dir`.

trails' canonical test schema does not lay that table: `schema_migrations` is in the drop list in `packages/activerecord/src/support/drop-all-tables.ts` and in the exclusion list in `support/canonical-schema-stamp.ts`. To keep those tests off `db_dir`, trails#8816 added `await Base.connectionPool().schemaMigration.createTable()` to the migration test case's setup and to "migrate clears schema cache afterward" in `packages/activerecord/src/tasks/database-tasks.test.ts`. Rails' tests have no such line.

## Acceptance criteria

- [ ] The canonical schema load leaves `schema_migrations` (and `ar_internal_metadata`, as `Schema.define` does) in the test database, or the story records why it cannot.
- [ ] The two `schemaMigration.createTable()` calls added to `tasks/database-tasks.test.ts` by trails#8816 are deleted.
- [ ] `pnpm vitest run packages/activerecord/src/tasks/database-tasks.test.ts` is green without them.
