---
title: "Drop the invented pool/schema_migrations fallbacks in assumeMigratedUptoVersion"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 5800
claim: "2026-08-01T13:33:46Z"
assignee: "assume-migrated-upto-version-drops-pool-fallbacks"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#assumeMigratedUptoVersion`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1908-1920`)
reaches the pool through an `(this.adapter as any).pool` cast and then falls
back to invented defaults Rails does not have:

- `pool?.schemaMigration?.tableName ?? "schema_migrations"` — Rails is
  `pool.schema_migration.table_name` (`schema_statements.rb:1366`), which raises
  if the pool is missing.
- `migrationContext ? ... : []` for both `migrated` and `allVersions` — Rails is
  `pool.migration_context.get_all_versions` / `.migrations`
  (`schema_statements.rb:1368-1370`), again with no nil guard.

`dumpSchemaInformation` (`:1874-1882`) has the same `?? "schema_migrations"`
fallback. A missing pool silently degrades to a bare table literal and an empty
migration set instead of failing loudly, so a mis-wired pool would emit
plausible-looking SQL against the wrong table.

The coverage added by PR #5795 pins the happy path only; the fallback arms are
unreachable in production wiring and untested.

## Acceptance criteria

- [ ] `assumeMigratedUptoVersion` reads `pool.schemaMigration.tableName` and
      `pool.migrationContext` without `??`/ternary fallbacks, matching
      `schema_statements.rb:1366-1370`.
- [ ] Same for the `?? "schema_migrations"` fallback in
      `dumpSchemaInformation`.
- [ ] The `(this.adapter as any).pool` cast is replaced with a typed host
      member, consistent with the retire-structural-casts work.
- [ ] Existing coverage in
      `schema-statements-assume-migrated-upto-version.trails.test.ts` still
      passes.
