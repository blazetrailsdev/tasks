---
title: "model-codegen BUILTIN_IGNORE should honor configurable bookkeeping table names"
status: done
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 4571
claim: "2026-07-04T21:07:08Z"
assignee: "model-codegen-ignore-tables-honor-configurable-names"
blocked-by: null
---

## Context

PR #4060 made `schema_migrations_table_name` / `internal_metadata_table_name`
configurable on `Base` and wired the runtime read paths (SchemaMigration,
InternalMetadata, SchemaDumper, truncateAll) to honor them. One path still
hardcodes the literals: `packages/activerecord/src/model-codegen.ts`
`const BUILTIN_IGNORE = new Set(["schema_migrations", "ar_internal_metadata"])`.
If `Base.schemaMigrationsTableName` / `internalMetadataTableName` (or
table_name_prefix/suffix) are changed, model codegen will emit a model for the
renamed bookkeeping table instead of ignoring it.

This is trails-specific tooling (no exact Rails counterpart), but it is the same
configurability gap the merged PR closed elsewhere.

## Acceptance criteria

- Compose the ignored names from `Base.tableNamePrefix + schemaMigrationsTableName/
internalMetadataTableName + tableNameSuffix` (reuse the `metadataTableNames()`
  helper in tasks/database-tasks.ts or an equivalent) rather than literals.
- Add/adjust a codegen test asserting a renamed bookkeeping table is still ignored.
