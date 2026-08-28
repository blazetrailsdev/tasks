---
title: "db:migrate / db:rollback in the frontiers CLI are still blocked on the eval context"
status: draft
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`frontiers-sql-js-adapter-has-no-connection-pool` (PR #7161) gave `SqlJsAdapter`
a pool, so `SchemaMigration` / `InternalMetadata` are no longer constructed
against `undefined`. That unblocked `db:migrate:status` — Rails'
`MigrationContext#migrations_status`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1316-1330`) only
parses filenames and never reaches `MigrationProxy#migration`, so it needs no
way to evaluate a migration file.

`db:migrate` and `db:rollback` are still blocked, one step earlier. Both call
`requireEvalContext()` (`packages/website/src/lib/frontiers/trails-cli.ts:175-177`,
called at `:252` and `:266`), which is `await deps.executeCode("")` — added by
PR #7138 so the host's own explanation surfaces instead of
`No database connection defined.` from `Migrator#connection`
(`packages/activerecord/src/migration.ts:2418` -> `database-tasks.ts:1285`).
In the browser sandbox `executeCode` rejects, so both commands fail there.

Their pool dependency is now fixed and merely unreached: the blocker is purely
that Ruby autoloads a migration file where the browser has to evaluate one.
`runtime.test.ts:131-137` pins the current failure
("errors explicitly when code execution is not available").

## Converged shape

Give the frontiers runtime a way to evaluate a migration file — the browser
analogue of Zeitwerk autoloading `db/migrate/*.rb` when
`MigrationProxy#migration` (`migration.rb:1080-1092`) first touches it — so
`db:migrate` / `db:rollback` run against the sandbox's sql.js database.

Whatever shape that takes, `requireEvalContext` stays the seam: it is the one
place the host's absence is reported, and it must keep failing loudly rather
than silently no-opping a migration.

## Acceptance criteria

- [ ] `db:migrate` applies a generated migration to the sandbox database in
      `runtime.test.ts`, with the schema_migrations row written through the
      pool PR #7161 added.
- [ ] `db:rollback` reverts it.
- [ ] The "code execution is not available" arm still fails loudly when no
      eval context is supplied.
