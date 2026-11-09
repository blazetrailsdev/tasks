---
title: "create-table-migration-template-inlines-its-body"
status: done
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9913
claim: "2026-11-09T13:05:48Z"
assignee: "create-table-migration-template-inlines-its-body"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/generators/active-record.ts` carries `createTableMigration()`, `kwargs` and `indexNameLiteral`, which `create_table_migration.ts.tt` calls for its whole body. Rails' `vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration/templates/create_table_migration.rb.tt` writes that loop inline in the template. It reads `attributes`, `attributes_with_index`, `primary_key_type` and `foreign_key_type` (`active_record/migration.rb:16-24`, `model_generator.rb:51`, `migration_generator.rb:59`). `MigrationGenerator#migration()` does the same for `migration.rb.tt`.

## Acceptance criteria

- `create_table_migration.ts.tt` (and `migration.ts.tt`) inline their bodies as the Rails templates do, and regenerate their `.tt.js` files.
- `createTableMigration`, `migration`, `kwargs` and `indexNameLiteral` are deleted along with their `@noRailsEquivalent CONVERGEABLE` receipts.
- The model and migration generator tests still pass.
