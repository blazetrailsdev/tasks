---
title: "active-record-model-generator-renders-create-table-migration"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Generators::ModelGenerator#create_migration_file`
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/model/model_generator.rb:24-28`)
renders the migration itself:

```ruby
migration_template "create_table_migration.rb", File.join(db_migrate_path, "create_#{table_name}.rb")
```

Its `source_paths` include the migration generator's template directory (`:19-22`), so the model and
`active_record:migration` share one `create_table_migration.rb.tt`, and the template reads the model
generator's own `attributes`, `attributes_with_index` (`:47-49`), `options[:timestamps]` and
`options[:primary_key_type]`.

trails' `active_record:model` (`packages/trailties/src/generators/active-record/model/model-generator.ts`,
since trails#8270) instead builds a second generator through the invented, protected
`createMigrationGenerator()`. That is the old `generators/migration-generator.ts` `MigrationGenerator`.
It calls `run(`create\_${tableName}`, rawAttributeStrings, { timestamps, primaryKeyType })`, which
re-parses the raw attribute strings, so the `--no-indexes` edit to `attr_options` (`:26`) never reaches
the migration. The website's `VfsModelGenerator` (`packages/website/src/lib/frontiers/vfs-generator.ts`)
overrides `createMigrationGenerator` to swap in its VFS migration generator.

Depends on `rails-migration-generator-does-not-hook-orm`, which moves the column-building body to
`active_record:migration`, where the create-table template can be shared.

## Acceptance criteria

- `createMigrationFile` calls `migrationTemplate` with the shared create-table template and
  `create_${tableName}` under `db/migrate`, reading this generator's `attributes`, including the
  `--no-indexes` edit.
- `createMigrationGenerator` is deleted, and so is the website override of it.
- `attributesWithIndex` is ported (`model_generator.rb:47-49`).
- "index is skipped for belongs to association" and "index is skipped for references association"
  assert the absent `index` that Rails asserts.
