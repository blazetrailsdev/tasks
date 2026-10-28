---
title: "Port the ActiveStorage migrations and the dummy app's test database"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-models
packages: ["activestorage"]
deps: ["activestorage-parity-enrollment-and-package"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/db/migrate/20170806125915_create_active_storage_tables.rb` (56) creates
`active_storage_blobs`, `active_storage_attachments` and
`active_storage_variant_records`, choosing the primary and foreign key types
from `primary_and_foreign_key_types` (`:4-6`, `:50-55`). `db/update_migrate/`
holds three upgrade migrations. The suite's database comes from
`test/database/setup.rb` (`connects_to` writing/reading, migrate, then
`create_users_migration.rb` and `create_groups_migration.rb`) and the `User` /
`Group` models in `test/test_helper.rb:129-201`. `test/migrations_test.rb` (2)
checks the migration's reversibility. RFC Design, "Test database".

## Acceptance criteria

- The engine migration and the three update migrations are ported as trails
  migrations under the package's `db/`.
- A package test setup mirrors `test/database/setup.rb` on each adapter, and
  `User` / `Group` are ported with their attachments as written.
- `migrations_test.rb` passes on SQLite, PostgreSQL and MariaDB.
