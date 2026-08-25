---
title: "createTable never calls validateCreateTableOptionsBang"
status: done
updated: 2026-08-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6066
claim: "2026-08-04T15:04:07Z"
assignee: "create-table-never-calls-validate-create-table-options"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#validateCreateTableOptionsBang`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:2182`)
has no callers anywhere in the package. Rails calls
`validate_create_table_options!(options)` from `create_table`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1709-1715`,
invoked at `schema_statements.rb:307`), so an unknown key passed to
`createTable` raises `ArgumentError` in Rails and is silently ignored in
trails.

## Converged shape

- `createTable` calls `validateCreateTableOptionsBang(options)` at Rails'
  call site, before `buildCreateTableDefinition`.
- The `ArgumentError` message matches Rails' `assert_valid_keys` output.
- A test covers an unknown `createTable` key raising.

## Acceptance criteria

- [ ] `validateCreateTableOptionsBang` is invoked from `createTable`, matching
      `schema_statements.rb:307`.
- [ ] Unknown-key `createTable` calls raise `ArgumentError`.
