---
title: "generators-migration-class-methods-on-the-host-class"
status: ready
updated: 2026-10-31
rfc: "0171-thor-port"
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

`Rails::Generators::Migration::ClassMethods` (`vendor/rails/v8.0.2/railties/lib/rails/generators/migration.rb:15-35`) defines `migration_lookup_at`, `migration_exists?`, `current_migration_number` and `next_migration_number` as class methods. A generator gets them by including `Rails::Generators::Migration`. `CreateMigration#existing_migration` (`vendor/rails/v8.0.2/railties/lib/rails/generators/actions/create_migration.rb:44-45`) reaches them through `@base.class.migration_exists?`.

In trailties these are free functions: `migrationLookupAt` and `migrationExists` in `packages/trailties/src/generators/migration-lookup.ts`, and `currentMigrationNumber` / `nextMigrationNumber` in `packages/trailties/src/generators/migration.ts`. `packages/trailties/src/generators/actions/create-migration.ts` calls `migrationExists(...)` directly instead of going through the host's class.

## Acceptance criteria

- [ ] `Migration::ClassMethods` is a module that a generator gets via `extend()`, with the four methods at their Rails names.
- [ ] `CreateMigration#existingMigration` calls `this.base.constructor.isMigrationExists(this.migrationDir, this.migrationFileName)`.
- [ ] The free-function copies are deleted.
