---
title: "migration-generator-db-migrate-path-and-usage"
status: draft
updated: 2026-11-02
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

`packages/trailties/src/generators/migration-generator.test.ts` still parks three tests of `vendor/rails/v8.0.2/railties/test/generators/migration_generator_test.rb`.

- `test_database_puts_migrations_in_configured_folder` and `..._with_aliases` (`:308-328`) and `test_add_migration_to_configured_path` (`:409-418`) need `db_migrate_path`; `packages/trailties/src/generators/active-record/migration/migration-generator.ts` hardcodes `"db/migrate"`. `with_database_configuration` (`railties/test/generators/generators_test_helper.rb:47-61`) is not in `generators-test-helper.ts`.
- `test_properly_identifies_usage_file` (`:341-343`) needs `packages/trailties/src/generators/rails/migration/USAGE`, which does not exist.

## Acceptance criteria

- The generator resolves its directory through `db_migrate_path` and `--database` / `--db`.
- `withDatabaseConfiguration` is ported and the migration generator has a USAGE file.
- The four tests are unparked with Rails' bodies.
