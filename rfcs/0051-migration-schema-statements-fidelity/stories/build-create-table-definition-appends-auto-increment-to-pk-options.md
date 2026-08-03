---
title: "buildCreateTableDefinition appends autoIncrement to validPrimaryKeyOptions"
status: ready
updated: 2026-08-03
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`buildCreateTableDefinition`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1484-1487`)
extracts the primary-key options with
`[...this.validPrimaryKeyOptions(), "autoIncrement"]`. Rails extracts exactly
`valid_primary_key_options` — `[:limit, :default, :precision]`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1588-1590`)
— at `schema_statements.rb:335`. The appended `autoIncrement` has no Rails
counterpart; in Rails an `auto_increment:` create_table option would not
survive `assert_valid_keys`.

## Converged shape

- The extraction list is `this.validPrimaryKeyOptions()` with nothing appended.
- Any adapter that genuinely needs an extra key overrides
  `validPrimaryKeyOptions` (Rails' own extension point, e.g. SQLite3's
  `valid_table_definition_options` at `sqlite3/schema_statements.rb:131`).

## Acceptance criteria

- [ ] `buildCreateTableDefinition` extracts only `validPrimaryKeyOptions()`.
- [ ] No `createTable` caller regresses (sweep for `autoIncrement:` passed as a
      table-level option).
