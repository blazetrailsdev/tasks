---
title: "buildCreateTableDefinition hardcodes autoIncrement instead of reading valid_primary_key_options"
status: done
updated: 2026-08-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6079
claim: "2026-08-04T17:44:59Z"
assignee: "build-create-table-definition-hardcodes-auto-increment"
blocked-by: null
closed-reason: null
---

## Context

`build_create_table_definition`
(vendor/rails/activerecord/lib/active*record/connection_adapters/abstract/schema_statements.rb:334-335)
splits the options hash with
`options.extract!(*valid*table_definition_options, :\_skip_validate_options)`and`options.extract!(\_valid_primary_key_options, :\_skip_validate_options)`— the
key sets come entirely from the adapter's two`valid*\*\_options` readers.

trails'
`buildCreateTableDefinition`
(packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1481-1490)
instead appends a hardcoded `"autoIncrement"` to
`this.validPrimaryKeyOptions()`, and never extracts `_skipValidateOptions`.
The hardcode predates PR #6066, which wired
`MysqlSchemaStatements#validPrimaryKeyOptions`
(`super + [:unsigned, :auto_increment]`,
vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:168-170),
so the adapter reader now supplies `autoIncrement` on the adapters Rails
supplies it on — making the hardcode both redundant on MySQL and a silent
extra key on SQLite/PostgreSQL, where Rails drops it.

## Converged shape

- `buildCreateTableDefinition` extracts using exactly
  `[...this.validTableDefinitionOptions(), "_skipValidateOptions"]` and
  `[...this.validPrimaryKeyOptions(), "_skipValidateOptions"]`.
- The `"autoIncrement"` literal is deleted.
- A test covers `autoIncrement:` reaching the primary key on MySQL and NOT on
  SQLite/PostgreSQL.

## Acceptance criteria

- [ ] No hardcoded key list in `buildCreateTableDefinition`; both splits read
      the adapter's `valid_*_options`.
- [ ] `_skipValidateOptions` is extracted on both sides, matching
      schema_statements.rb:334-335.
