---
title: "Migrator#internalMetadata is a public reader Rails does not have"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5862
claim: "2026-08-02T03:26:47Z"
assignee: "migrator-internal-metadata-public-reader"
blocked-by: null
closed-reason: null
---

## Context

`Migrator` exposes `internalMetadata` as a public getter
(`packages/activerecord/src/migration.ts`). Rails' `Migrator` holds
`@internal_metadata` as an ivar with no reader
(`vendor/rails/activerecord/lib/active_record/migration.rb:1421-1432`); the
public accessor is `MigrationContext#internal_metadata` (`migration.rb:1214-1218`,
sourced from `connection_pool`).

PR #5845 removed the sibling `schemaMigration` getter from `Migrator` (its
callers now build a `SchemaMigration` directly, and `MigrationContext` owns the
Rails-sited accessor), but left `internalMetadata` because it sits outside the
`MigrationContext-style methods` block that story was scoped to. Callers include
`packages/trailties/src/commands/db.test.ts` and
`packages/activerecord/src/migrator.trails.test.ts`.

## Acceptance criteria

- [ ] `Migrator#internalMetadata` is gone; callers construct an
      `InternalMetadata` or read `MigrationContext#internalMetadata`.
- [ ] `Migrator` keeps the collaborator as private state, as
      `migration.rb:1421-1432` does.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, 500 LOC ceiling, single PR from main.
