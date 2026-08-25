---
title: "MigrationContext#migrate/up/down have no end-to-end DDL coverage"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 160
pr: 6124
claim: "2026-08-05T11:59:55Z"
assignee: "burn-down-non-transactional-row-write-ratchet"
blocked-by: null
closed-reason: null
---

## Context

PR #5820 gave `MigrationContext` the run surface Rails has at
`vendor/rails/activerecord/lib/active_record/migration.rb:1220-1280`
(`migrate` / `up` / `down` / `rollback` / `forward` / `run` / `open`) and
covered `open`, `migrationsStatus`, `currentEnvironment`,
`lastStoredEnvironment`, `pendingMigrationVersions` and the `rollback`/`forward`
routing through `move` in
`packages/activerecord/src/migration-context.trails.test.ts`.

What is **not** covered is an end-to-end run: no test calls
`MigrationContext#migrate` / `#up` / `#down` and asserts the migrations actually
executed against a database. The disk fixtures that would drive it
(`packages/activerecord/src/test-helpers/migrations/valid/`) do real DDL —
`addColumn("people", "last_name")`, `createTable("reminders")`,
`createTable("people_reminders")` — against the canonical schema, and no
existing test in `migrator.test.ts` runs them (it only exercises discovery and
`migrationsStatus`). Wiring that up safely — deciding whether the canonical
`people` table can take the column, or whether a dedicated fixture directory is
needed — was more than PR #5820 should carry, so the run surface is currently
pinned only at the dispatch level.

Rails covers this in
`vendor/rails/activerecord/test/cases/migration_test.rb` and
`migrator_test.rb`; check there for the tests to mirror before inventing any.

## Acceptance criteria

- [ ] `MigrationContext#migrate` / `#up` / `#down` are covered end-to-end:
      migrations run, schema_migrations rows land, and `down` reverses them.
- [ ] Fixture migrations used are the vendored Rails ones already mirrored under
      `test-helpers/migrations/`; no invented tables (CLAUDE.md canonical-tables
      rule).
- [ ] Test names match the Rails originals verbatim where one exists.
