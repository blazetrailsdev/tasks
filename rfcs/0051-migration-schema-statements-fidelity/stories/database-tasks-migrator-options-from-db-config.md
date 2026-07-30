---
title: "Build every DatabaseTasks Migrator from its dbConfig (useMetadataTable, env)"
status: draft
updated: 2026-07-30
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasks` builds its `Migrator` instances by hand, and most call sites
pass no options — which silently drops the config's `use_metadata_table` and
stamps `ar_internal_metadata.environment` from `TRAILS_ENV` / `NODE_ENV`
instead of the config's own env (`Migrator`'s fallbacks,
`packages/activerecord/src/migration.ts:2147-2153`). Rails never has this
gap: the migrator is built from the pool
(`migration_connection_pool.migration_context`,
`connection_adapters/abstract/connection_pool.rb:294-296`), and
`InternalMetadata#enabled?` reads `pool.db_config.use_metadata_table`, so the
config always governs.

PR #5616 fixed three of these while delegating the trailties CLI to
`DatabaseTasks` — `migrate`
(`packages/activerecord/src/tasks/database-tasks.ts:356`) and the shared
`_stepMigrations` behind `rollback` / `forward` (`:416`) now pass
`{ environment: dbConfig.envName, internalMetadataEnabled: dbConfig.useMetadataTable }`.
The remaining sites were out of that story's scope:

- `migrateAll` — `database-tasks.ts:1085`, runs `migrator.migrate(version)`
- `prepareAll` — `database-tasks.ts:1117`, runs `migrator.migrate(version)`
- `migrateStatus` — `database-tasks.ts:1021` (read-only)
- `currentVersion` — `database-tasks.ts:1054` (read-only)
- `prepareAll`'s pending-version scan — `database-tasks.ts:1147` (read-only)

The two writing sites are the live defect: an app with
`useMetadataTable: false` gets `ar_internal_metadata` written anyway by
`db:migrate`-style fan-out and `db prepare`, and a non-default env config gets
the wrong environment stamp.

## Acceptance criteria

- [ ] `migrateAll` and `prepareAll` build their `Migrator` with
      `environment` / `internalMetadataEnabled` derived from the `dbConfig`
      they already have in hand, matching the `migrate` / `_stepMigrations`
      sites #5616 converged.
- [ ] The read-only sites (`migrateStatus`, `currentVersion`, the pending
      scan) are brought along or the reason they don't need it is stated at
      the call site.
- [ ] Prefer one shared private helper over repeating the options literal at
      six sites.
- [ ] Regression coverage: a config with `useMetadataTable: false` migrated
      through `migrateAll` (and through `prepareAll`) leaves no
      `ar_internal_metadata` table. Confirm it fails on baseline.
