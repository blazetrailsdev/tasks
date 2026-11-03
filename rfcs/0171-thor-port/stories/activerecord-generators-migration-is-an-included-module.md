---
title: "ActiveRecord::Generators::Migration is an included module with ClassMethods"
status: draft
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Generators::Migration` (`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration.rb:7-50`) is an `ActiveSupport::Concern` that includes `Rails::Generators::Migration`. Its `ClassMethods#next_migration_number` is `current_migration_number(dirname) + 1` passed to `ActiveRecord::Migration.next_migration_number`, and its private `primary_key_type`, `foreign_key_type`, `db_migrate_path`, `default_migrate_path` and `configured_migrate_path` are instance members.

In trails (`packages/trailties/src/generators/active-record/migration.ts`) these are free functions. `MigrationGenerator` (`active-record/migration/migration-generator.ts`) assigns them by hand: `static nextMigrationNumber = nextMigrationNumber` and instance fields `dbMigratePath = dbMigratePath` and so on. trails#9667 converted `Rails::Generators::Migration` into a plain-object module with an extended `ClassMethods`, but left the ActiveRecord one as it was.

## Acceptance criteria

- `ActiveRecord::Generators::Migration` is a module with a `ClassMethods`. The generator base takes it with `include()` / `extend()`, and the module records its include of `Rails::Generators::Migration`.
- The hand-assigned static and instance fields on `MigrationGenerator` are removed.
