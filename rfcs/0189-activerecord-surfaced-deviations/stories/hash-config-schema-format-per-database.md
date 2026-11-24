---
title: "activerecord: port HashConfig#schema_format and default database_tasks to it"
status: draft
updated: 2026-11-24
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails 8.0.5.2 reads `schema_format` per database config:
`HashConfig#schema_format`
(`vendor/rails/v8.0.5.2/activerecord/lib/active_record/database_configurations/hash_config.rb:161-165`)
is `configuration_hash[:schema_format]&.to_sym || ActiveRecord.schema_format`, and it
raises `"Invalid schema format"` unless the value is `:ruby` or `:sql`. Its callers default to
`db_config.schema_format`: `schema_dump` (`:149`), `DatabaseTasks#load_schema` /
`dump_schema` / `schema_dump_path` / `reconstruct_from_schema` / `schema_up_to_date?`
(`tasks/database_tasks.rb:376-485`), and `railties/databases.rake:466,480,529,554`.
trails' `HashConfig` (`packages/activerecord/lib/database-configurations/hash-config.ts`)
has no `schemaFormat`. Its callers default to the global `schemaFormat()`. The rows
are in `scripts/parity/bump-ledger/rails.json`.

## Converged shape

Port `HashConfig#schemaFormat` (formats `"ts"` / `"sql"` for trails' `:ruby` / `:sql`),
raise `"Invalid schema format"` as Rails does, and default every listed caller to
`dbConfig.schemaFormat()`. Delete the matching bump-ledger rows.

## Acceptance criteria

- [ ] The `multi_dbs_test.rb` tests `each database can have its own schema_format`,
      `defaults to ruby schema_format` and `raises an exception for invalid schema formats` pass.
- [ ] Ledger rows removed.
