---
title: "activerecord: database-tasks.test.ts bodies match database_tasks_test.rb"
status: draft
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/tasks/database-tasks.test.ts` shares its test names with `vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb` but most bodies are not the Rails bodies. trails#8816 ported `with_stubbed_new` and the `db_dir` stubs only. What remains:

- `DatabaseTasksCheckProtectedEnvironmentsTest` (`:60-154`) builds a temp SQLite file, registers a stub task and writes `schema_migrations` / `ar_internal_metadata` with raw SQL, where Rails uses `recreate_metadata_tables` and `ActiveRecord::Base.connection_pool.internal_metadata[:environment] = current_env`.
- `DatabaseTasksDumpSchemaCacheTest` / `DatabaseTasksDumpSchemaTest` (`:287-400`) stub `db_dir` with a flat `vi.spyOn(..., "get")` and restore in `afterEach`, where Rails wraps each body in `DatabaseTasks.stub(:db_dir, dir) do`. `test_ensure_db_dir` opens its own SQLite file instead of merging `schema_dump:` into the `arunit` config (`:366-367`).
- The `*CurrentTest` describes spy on `Base.establishConnection` in `beforeEach`, where Rails has `with_stubbed_configurations_establish_connection` (`:598-606`) stubbing `connection_handler.establish_connection` per test.
- `DatabaseTasksMigrationTestCase` (`:1029-1060`) is a hand-written ATTACH-and-copy helper where Rails uses `SQLite3::Backup`.
- `test_migrate_clears_schema_cache_afterward` (`:1236-1240`) is two lines in Rails; the trails test opens a temp database, registers a task and rewrites the configurations.
- The trailing `DatabaseTasksWithTemporaryPoolTest` describe has no Rails counterpart and belongs in a `.trails.test.ts` file.
- The file imports `node:fs`, `node:os` and `node:path` and reads `process.env` directly.

`activerecord-port-database-tasks-per-adapter-cases` covers missing tests in this file, not these bodies.

## Acceptance criteria

- [ ] Each test body is the Rails body line for line, with Rails' helper methods (`with_stubbed_configurations_establish_connection`, `config_for`, `assert_called_for_configs`) ported under their Rails names.
- [ ] `db_dir`, `env` and `root` are stubbed with a block-scoped stub where Rails calls `stub`.
- [ ] `DatabaseTasksWithTemporaryPoolTest` moves to a `.trails.test.ts` file.
- [ ] No `node:*` import and no `process.*` reference remains in the file.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
