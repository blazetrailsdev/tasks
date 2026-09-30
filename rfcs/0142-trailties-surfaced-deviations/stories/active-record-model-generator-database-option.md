---
title: "active-record-model-generator-database-option"
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

`ActiveRecord::Generators::ModelGenerator` now lives at the `active_record:model` namespace
(`packages/trailties/src/generators/active-record/model/model-generator.ts`), reached from
`rails:model`'s `hookFor("orm")`. It declares `migration`, `timestamps`, `parent`, `indexes` and
`primaryKeyType`, but not Rails' sixth class option:

- `class_option :database, type: :string, aliases: %i(--db)`
  (`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/model/model_generator.rb:17`).
- Its arms: `skip_migration_creation?` is `custom_parent? && !database || !migration` (`:43-45`);
  `create_model_file` runs `generate_abstract_class if database && !custom_parent?` (`:30`);
  `parent_class_name` returns `abstract_class_name` (`"#{database.camelize}Record"`) when
  `database` is set without a custom parent (`:52-60,70-72`); and `generate_abstract_class`
  writes `app/models/#{database.underscore}_record.rb` from `abstract_base_class.rb` unless it
  exists (`:62-67`).
- The migration goes to `db_migrate_path` (`active_record/migration.rb`), which reads the
  database config's `migrations_paths` for `--database`.

trails' `isSkipMigrationCreation` is `isCustomParent() || !migration()`, and `parentClassName`
returns `parent()` unconditionally. The migration is written by the old `generators/migration-generator.ts`
(`createMigrationGenerator`), which always writes to `db/migrate`.

The Rails tests are `it.skip` in `packages/trailties/src/generators/model-generator.test.ts`:
"model with database option", "model with parent and database option", "model with no migration and
database option", "model with parent option database option and no migration option",
"model with underscored database option", "database puts migrations in configured folder",
"database puts migrations in configured folder with aliases".

Separately, `parity:api` scores the file as having no Rails counterpart: trailties' Ruby side is
railties only, so `activerecord/lib/rails/generators/**` is not mapped onto
`trailties/src/generators/active-record/**` (`scripts/parity/conventions.ts`).

## Acceptance criteria

- `ModelGenerator.classOption("database", { type: "string", aliases: ["--db"], desc })` with Rails' desc.
- `isSkipMigrationCreation`, `parentClassName`, `generateAbstractClass`, `abstractClassName`
  and `database` mirror `model_generator.rb:43-80`, and `createModelFile` calls
  `generateAbstractClass` under Rails' guard.
- The migration lands in the `--database` config's migrations path.
- The seven skipped tests above are ported and pass.
