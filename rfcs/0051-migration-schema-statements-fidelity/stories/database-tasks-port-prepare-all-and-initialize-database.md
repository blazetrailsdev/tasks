---
title: "Port DatabaseTasks.prepareAll / initializeDatabase instead of inlining them in the trailties CLI"
status: in-progress
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 5584
claim: "2026-07-29T18:28:17Z"
assignee: "database-tasks-port-prepare-all-and-initialize-database"
blocked-by: null
closed-reason: null
---

## Context

Rails' `db:prepare` runs through `DatabaseTasks.prepare_all`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:174-205`),
which iterates `each_current_configuration(env)` calling the private
`initialize_database(db_config)` (`:652-669`), then walks
`each_current_environment` / `db_configs_with_versions` to migrate each
version, dumps schemas when `dump_schema_after_migration`, and finally
`load_seed` once if any database was freshly initialized.

trails has neither `prepareAll` nor `initializeDatabase` on `DatabaseTasks`.
Instead `packages/trailties/src/commands/db.ts` (`prepare` subcommand)
reimplements a single-database subset of `initialize_database` inline in the
CLI action: probe `schemaMigrationTableExists()`, rescue `NoDatabaseError` →
`DatabaseTasks.create(config)` → re-probe, then migrate and seed when the
database was not already initialized.

Surfaced in PR #5545 review. That PR moved the `Created database` banner into
`DatabaseTasks.create`, which made the CLI's previously-unconditional create
start printing `Database '<name>' already exists` on every prepare of an
existing database. The inline probe fixed the symptom; the structural gap —
the whole `prepare_all` / `initialize_database` pair living in the CLI rather
than in `DatabaseTasks` — is what this story closes.

Consequences of the current shape:

- `db prepare` handles only the primary config, not
  `each_current_configuration`, so multi-database apps prepare one database.
- No `dump_schema_after_migration` dump step.
- Seeding is per-database inline rather than Rails' single `load_seed if seed`
  after all configs are initialized.
- The schema-dump-path load arm (`load_schema` when the dump file exists,
  `:661-666`) is absent, so a fresh database is migrated from scratch instead
  of loaded from `schema.ts`.

## Acceptance criteria

- [ ] `DatabaseTasks.prepareAll` ported to
      `packages/activerecord/src/tasks/database-tasks.ts`, matching
      `database_tasks.rb:174-205` (per-config initialize, per-version migrate,
      conditional schema dump, single trailing seed).
- [ ] `initializeDatabase(dbConfig)` ported as its private helper, matching
      `:652-669` including the schema-dump-path `loadSchema` arm and the
      `!database_already_initialized` return value.
- [ ] `trailties`' `db prepare` subcommand delegates to
      `DatabaseTasks.prepareAll()` and carries no inline probe/create/seed
      logic of its own.
- [ ] Multi-database prepare covered by a test.
- [ ] No new wide call-mismatch baselines for `prepare_all` /
      `initialize_database`.

Hard rules: no `node:*` imports. No `process.*` references. Async fs only.
Test names match Rails verbatim.
