---
title: "database-tasks.test: port DatabaseTasksMigrationTestCase shared setup (incl. SQLite3::Backup) and drop the invented :memory: config"
status: in-progress
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5299
claim: "2026-07-25T13:18:53Z"
assignee: "database-tasks-migration-test-case-shared-setup"
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasksMigrateTest` and `DatabaseTasksMigrateStatusTest` in
`packages/activerecord/src/tasks/database-tasks.test.ts` each establish their
own `:memory:` connection in `beforeEach`. In Rails both are subclasses of
`DatabaseTasksMigrationTestCase`
(`vendor/rails/activerecord/test/cases/tasks/database_tasks_test.rb:1029-1060`),
whose shared `setup` establishes `:memory:` once — deliberately, "to avoid
having to rollback at the end" — then backs the ambient file DB into it with
`SQLite3::Backup`. The base also sets `self.use_transactional_tests = false`
and a `folder_name` class attribute, and provides
`capture_migration_output`.

PR #5288 verified these `:memory:` sites are Rails-faithful and kept them
(they are 2 of the 2 legitimate `:memory:` lines in this Rails file). Two
residual deviations were left untouched and are worth tracking:

1. There is no shared `DatabaseTasksMigrationTestCase` equivalent, so the
   setup is duplicated per describe and the `SQLite3::Backup` step (copying
   the ambient file DB into the memory DB) is not ported at all — the memory
   DB starts empty rather than as a copy of the fixture database.
2. `DatabaseTasksMigrateTest` sets
   `DatabaseTasks.databaseConfiguration = { development: { database: ":memory:" } }`,
   a trails invention with no Rails counterpart — Rails leaves the ambient
   `arunit` configurations in place while the _connection_ is `:memory:`.

`DatabaseTasksMigrateScopeTest` is a third subclass of the same Rails base but
uses a file-backed DB in trails, so it diverges in the opposite direction —
converging all three onto one shared helper would settle it.

## Acceptance criteria

- [ ] A shared setup helper mirrors `DatabaseTasksMigrationTestCase`, used by
      the Migrate / MigrateStatus / MigrateScope describes.
- [ ] The `SQLite3::Backup` step is ported or its absence justified at the call
      site.
- [ ] The invented `development: { database: ":memory:" }` configuration is
      removed or replaced with the ambient config shape.
- [ ] Test names unchanged; `test:compare` delta non-negative.
