---
title: "schema_format uses ts/js/sql where Rails has :ruby/:sql; schema_dump default is schema.ts"
status: draft
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trails#8073 (`hash-config-defaults-diverge-from-rails-schema-dump-and-cache-path`).

- `ActiveRecord.schema_format` defaults to `:ruby` (`vendor/rails/activerecord/lib/active_record.rb:372-373`).
- `HashConfig#schema_dump(format = ActiveRecord.schema_format)` maps `:ruby` to `"schema.rb"` and `:sql` to `"structure.sql"` (`database_configurations/hash_config.rb:149-177`).
- `hash_config_test.rb:106-108` asserts the default is `"schema.rb"`.

trails' `SchemaFormat` is `"ts" | "js" | "sql"` (`packages/activerecord/src/tasks/database-tasks.ts:38`), and it defaults to
`"ts"` (`packages/activerecord/src/active-record.ts`). `HashConfig#schemaFileType` adds `"ts"` →
`schema.ts` and `"js"` → `schema.js` arms Rails does not have, and keeps a `"ruby"` arm that no
`SchemaFormat` value can reach. So `hash-config.test.ts` "default schema dump value" asserts
`"schema.ts"`, which `parity:test --assertions` reports as a value mismatch.

## Converged shape

`schema_format` takes Rails' values `:ruby | :sql`, where `:ruby` is trails' host-language dump
(the TS/JS DSL `SchemaDumper.language` already selects). `schema_file_type` keeps only Rails'
two arms. Whether `:ruby` then spells `schema.rb` or maps to the host-language file name through a
convention row in `scripts/parity/conventions.ts` (`RUBY_FILE_TS_OVERRIDES`-style) is the decision
this story makes.

## Acceptance criteria

- [ ] `SchemaFormat` and `schema_file_type` converge on Rails' two formats, or the file-name mapping is ratified in `conventions.ts` with its reason.
- [ ] `hash-config.test.ts` "default schema dump value" matches Rails' assertion value, with no `parity:test` value mismatch.
