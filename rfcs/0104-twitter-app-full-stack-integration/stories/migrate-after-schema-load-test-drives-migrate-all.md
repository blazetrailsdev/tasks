---
title: "Drive the schema-load migrate regression test through migrate_all/initialize_database"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`db-migrate-loads-schema` (PR #7317) fixed `trails db migrate` re-running every
dumped migration: the dumper had demoted `define_params`
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:92-94`) to a
comment, so a loaded schema never stamped `schema_migrations` and
`initialize_database` (`tasks/database_tasks.rb:652-670`) left every migration
pending.

The regression test it shipped
(`packages/activerecord/src/tasks/database-tasks-migrate-after-schema-load.trails.test.ts`)
calls `DatabaseTasks.loadSchema(...)` directly and then asserts
`pendingMigrationVersions()` is empty. That exercises the fixed mechanism and
does fail on the pre-fix code, but it is one step removed from the reported
repro, which is `db drop && db create && db migrate` — i.e. `migrate_all`
(`database_tasks.rb:243-260`) reaching `initialize_database`, which is the
function that decides to load the schema at all.

The gap that leaves: nothing covers `initialize_database`'s own
`database_already_initialized` branch. A regression that stopped it calling
`load_schema` — or that made it call it on an already-initialized database —
would not fail this test.

## Converged shape

Drive the test through the public entry point the bug was reported against:
dump a schema, drop and recreate the database, then call
`DatabaseTasks.migrateAll()` and assert it completes without a duplicate
`CREATE TABLE` and that the tables exist. Keep the direct `loadSchema`
assertion as the narrower unit if useful, but the cycle-level test is the one
that matches `database_tasks.rb:243-260, 652-670`.

## Acceptance criteria

- A test performs drop → create → `migrateAll()` against a populated
  `db/schema.ts` and passes.
- It fails on the pre-#7317 dumper (schema loaded, versions unstamped) with the
  reported `table "users" already exists`.
- `initialize_database`'s already-initialized arm is covered — a second
  `migrateAll()` on the same database does not reload the schema.
