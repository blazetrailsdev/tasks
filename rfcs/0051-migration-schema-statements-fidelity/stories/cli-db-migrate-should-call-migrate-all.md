---
title: "cli-db-migrate-should-call-migrate-all"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
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

Rails' `rake db:migrate`
(`vendor/rails/activerecord/lib/active_record/railties/databases.rake:89-92`)
calls `DatabaseTasks.migrate_all`, never `migrate` directly, and takes its
target version from `ENV["VERSION"]` via `target_version` — `migrate_all`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:243-256`)
accepts no version argument.

trails' `dbMigrate` (`packages/activerecord-cli/src/db-tasks.ts:116-137`)
instead reads a `--version` flag and calls `DatabaseTasks.migrate(version)`
inside `withTemporaryPoolForEach(env, …)`. `DatabaseTasks.migrateAll()`
(`packages/activerecord/src/tasks/database-tasks.ts:949-982`) already ports
`migrate_all` faithfully — single-primary fast path, `dbConfigsWithVersions`,
sorted per-version `withTemporaryConnection` dispatch — so the CLI is
hand-rolling multi-db routing that exists correctly one layer down. The
practical divergence: in a multi-db setup with different pending versions per
database, the CLI loop migrates every config to the same explicit target
instead of letting each stop at its own pending version.

Raised in review of PR #5473, which only added the pool wrapper (the CLI's
direct `migrate(version)` call predates it); converting the call site is
separate work because it changes the `--version` contract.

## Acceptance criteria

- [ ] `dbMigrate` calls `DatabaseTasks.migrateAll()` rather than looping
      `migrate(version)` over the env's configs.
- [ ] `--version` is threaded the way Rails threads `VERSION` — set the env var
      through the activesupport `setEnv` process adapter so `targetVersion()`
      picks it up — or the flag is dropped, with the choice justified against
      `databases.rake:89` at the call site. No `process.*` references.
- [ ] `db-migrate.test.ts` assertions updated to the new call shape. Existing
      test names unchanged (these are trails CLI tests, not Rails-matched).
- [ ] The sqlite happy-path E2E (`__e2e__/sqlite-happy-path.test.ts`) still
      passes: `migrateAll` establishes its own pool via `initializeDatabase`,
      so the CLI needs no ambient connection.
