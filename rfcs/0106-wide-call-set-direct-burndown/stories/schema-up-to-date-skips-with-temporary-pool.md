---
title: "schema-up-to-date-skips-with-temporary-pool"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6678
claim: "2026-08-17T23:32:58Z"
assignee: "schema-up-to-date-skips-with-temporary-pool"
blocked-by: null
closed-reason: null
---

# DatabaseTasks.schemaUpToDate does not wrap its metadata reads in with_temporary_pool

## Context

`tasks/database_tasks.rb:397-411`:

```ruby
def schema_up_to_date?(configuration, format = ActiveRecord.schema_format, file = nil)
  db_config = resolve_configuration(configuration)
  file ||= schema_dump_path(db_config)
  return true unless file && File.exist?(file)

  with_temporary_pool(db_config) do |pool|
    internal_metadata = pool.internal_metadata
    return false unless internal_metadata.enabled?
    return false unless internal_metadata.table_exists?
    internal_metadata[:schema_sha1] == schema_sha1(file)
  end
end
```

trails' `DatabaseTasks.schemaUpToDate`
(`packages/activerecord/src/tasks/database-tasks.ts`) reads
`InternalMetadata` off `this._migrationAdapter()` — the already-established
migration pool — instead of establishing a temporary pool for `dbConfig`. It
also catches `ConnectionNotDefined` and answers `false`, which Rails has no
analogue for, and it never consults `internal_metadata.enabled?`.

`wave-4e-schema-migration-tasks-residue` converged the sibling rows in this
file (`resolve_configuration`, `configs_for`, `local_database?`, …) but left
this one: `schema_up_to_date?` sits on the `reconstruct_from_schema` /
`test:prepare` fast path, and swapping in `withTemporaryPool` re-establishes
and restores a connection mid-flight, which is an adapter-lane risk that
deserves its own PR. The row is baselined with a reviewed per-site reason in
`scripts/api-compare/call-mismatches-exclude/activerecord/tasks/database-tasks.json`.

## Acceptance criteria

- [ ] `schemaUpToDate` wraps its metadata reads in
      `this.withTemporaryPool(dbConfig, ...)`, reading `pool.internalMetadata`,
      and mirrors the `enabled?` / `table_exists?` early returns in Rails' order.
- [ ] Delete the `schema_up_to_date? | with_temporary_pool` row from the
      exclude shard by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten activerecord/tasks/database-tasks.json`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — this body runs on
      every `test:prepare`.
