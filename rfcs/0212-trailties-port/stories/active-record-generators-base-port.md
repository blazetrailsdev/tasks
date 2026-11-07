---
title: "active-record-generators-base-port"
status: draft
updated: 2026-11-07
rfc: "0212-trailties-port"
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

`ActiveRecord::Generators::Base` (`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record.rb`) is `NamedBase` plus `include ActiveRecord::Migration` and a `base_root`. trails' `ActiveRecord::Generators::ModelGenerator` (`packages/trailties/src/generators/active-record/model/model-generator.ts`) extends `NamedBase` directly, so `create_migration_file` (`active_record/model/model_generator.rb`) cannot call `migration_template "create_table_migration.rb", ...` and instead constructs a `MigrationGenerator` and calls its `createMigrationFile`. The call gate baseline row is in `scripts/api-compare/call-mismatches-exclude/trailties/generators/active-record/model/model-generator.json`. That row surfaced once the Ruby manifest recorded the generators under activerecord's `lib/rails/generators`.

## Acceptance criteria

- `ActiveRecord::Generators::Base` is ported in `packages/trailties/src/generators/active-record.ts`, and the AR model/migration/application-record generators extend it.
- `ModelGenerator#createMigrationFile` calls `migrationTemplate("create_table_migration.ts", ...)` with its own copy of the template, as Rails does.
- The baseline row is deleted.
