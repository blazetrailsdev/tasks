---
title: "pool-migration-context-is-not-rails-migration-context"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5805
claim: "2026-08-01T17:39:01Z"
assignee: "pool-migration-context-is-not-rails-migration-context"
blocked-by: null
closed-reason: null
---

## Context

`pool.migrationContext` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:543-546`)
returns the class named `MigrationContext` at
`packages/activerecord/src/migration.ts:1677`, but that class is not a port of
Rails' `MigrationContext` — it is a schema-DSL context whose methods are
`createTable` / `addColumn` / `addIndex` / `tableExists` etc. It has neither
`getAllVersions` nor `migrations`, and it is constructed from an adapter proxy
rather than from `migrationsPaths` the way Rails builds it
(`vendor/rails/activerecord/lib/active_record/migration.rb:1211-1215`).

Rails' `MigrationContext` owns:

- `get_all_versions` (`migration.rb:1282-1288`) — `schema_migration.integer_versions`, `[]` when the table is absent.
- `migrations` (`migration.rb:1303-1315`) — parses `migration_files` into `MigrationProxy`es, `version.to_i`.
- `migration_files` / `parse_migration_filename` (`migration.rb:1368-1375`).
- `current_version`, `migrations_paths`, `schema_migration`, `internal_metadata`.

In trails those responsibilities live on `Migrator` instead
(`migration.ts:2144+`; `getAllVersions` at `:2615`, `migrations` at `:2184`,
`migrationsPaths` at `:3166`, under a literal
`// --- MigrationContext-style methods (Rails: MigrationContext) ---` banner).

The consequence is that `SchemaStatements#assumeMigratedUptoVersion`
(`connection-adapters/abstract/schema-statements.ts`), which mirrors
`schema_statements.rb:1364-1383` by calling
`pool.migration_context.get_all_versions` / `.migrations`, cannot work against
a real pool — those members do not exist on what `pool.migrationContext`
returns. PR #5800 dropped the invented `migrationContext ? ... : []` fallbacks
that were silently masking this (they made the method a no-op that could also
re-insert an already-migrated version), so the gap is now visible rather than
hidden, but the underlying mis-layering is untouched. It is the only
production call site of these members in the package.

PR #5800 added `schemaMigration` / `getAllVersions` / `migrations` to the class
the pool hands back, so the call site runs, but `migrations` delegates to
`Migrator.discoverMigrations(Migrator.migrationsPaths)` — the **global** static
path list. Rails keeps `migrations_paths` as per-instance constructor state
(`migration.rb:1214-1218`, `attr_reader :migrations_paths`), so two contexts
built for two different migration directories collide in trails where they
would not in Rails. Fixing the constructor (AC 3) is what removes the collision.

## Acceptance criteria

- [ ] `pool.migrationContext` returns an object that genuinely owns
      `getAllVersions` and `migrations`, mirroring `migration.rb:1282-1315` —
      either by porting Rails' `MigrationContext` onto the class the pool
      hands back, or by moving the `MigrationContext-style` block off
      `Migrator` onto it.
- [ ] The existing schema-DSL class currently occupying the
      `MigrationContext` name is renamed or relocated so the ported name maps
      to its Rails counterpart (fidelity of names).
- [ ] The pool constructs it the way Rails does
      (`MigrationContext.new(migrations_paths, schema_migration,
internal_metadata)`, `migration.rb:1214`) rather than from an adapter
      proxy.
- [ ] `assumeMigratedUptoVersion` works end to end against a real pool, with
      coverage that does not stub `pool.migrationContext`.
- [ ] `Migrator` keeps only what Rails' `Migrator` owns (`migration.rb:1440+`).
