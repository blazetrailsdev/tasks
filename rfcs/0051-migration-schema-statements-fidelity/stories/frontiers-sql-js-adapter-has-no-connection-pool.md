---
title: "frontiers-sql-js-adapter-has-no-connection-pool"
status: claimed
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-28T14:07:26Z"
assignee: "db-schema-load-sql-reports-success-for-memory-noop"
blocked-by: null
closed-reason: null
---

## Context

The frontiers browser CLI never establishes an ActiveRecord connection, so
`SqlJsAdapter` has no `pool`: `packages/website/src/lib/frontiers/sql-js-adapter.ts`
defines no `pool` member at all, yet
`packages/website/src/lib/frontiers/trails-cli.ts:178-179` constructs
`new SchemaMigration(adapter.pool)` / `new InternalMetadata(adapter.pool)` with
it. Both therefore hold `undefined`.

Every `db:*` command that reaches AR fails on that. Measured on PR #7138's
branch with a scratch test against the real runtime:

- `db:migrate:status` after `generate model User name:string` →
  `Error: Cannot read properties of undefined (reading 'withConnection')`,
  raised from `SchemaMigration` against the undefined pool.
- `db:migrate` / `db:rollback` fail earlier, on the eval context — PR #7138
  added `requireEvalContext` so the host's own explanation surfaces instead of
  `No database connection defined.` from
  `Migrator#connection` (`packages/activerecord/src/migration.ts:2418` →
  `database-tasks.ts:1285`). Their pool dependency is unfixed and merely
  unreached.

Rails' `MigrationContext#migrations_status`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1316-1330`) only
parses filenames and never loads a migration file, so status is the one `db:*`
command that could work with no eval context — it is blocked purely by the
missing pool.

No test covers this: `runtime.test.ts` exercises `db:migrate`, `db:seed` and
`db:drop`, never `db:migrate:status`.

## Acceptance criteria

- [ ] `SqlJsAdapter` exposes a real connection pool (or the CLI obtains one),
      so `SchemaMigration` / `InternalMetadata` are constructed against a live
      pool rather than `undefined`.
- [ ] `db:migrate:status` reports migration status in the frontiers runtime
      with no eval context available, mirroring Rails' `migrations_status`
      never reaching `MigrationProxy#migration`.
- [ ] A test covers `db:migrate:status` in `runtime.test.ts`.
