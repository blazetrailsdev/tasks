---
title: "createtable-if-not-exists-preserves-block-indexes"
status: done
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4774
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from Codex review of PR #4774
(collapse-migrationcontext-introspection-onto-adapter-remaining).
`MigrationContext#createTable` short-circuits with an early `return` when
`ifNotExists: true` and the table already exists
(`packages/activerecord/src/migration.ts`, the `options?.ifNotExists &&
await this.tableExists(name)` guard — pre-existing since #4773, PR #4774 only
added the `await`). This skips the block's `td.indexes`.

Rails does NOT short-circuit in Ruby: `create_table` builds the definition,
executes `schema_creation.accept(td)` (which emits `CREATE TABLE IF NOT
EXISTS` when `if_not_exists`), then still iterates `td.indexes` calling
`add_index(table, cols, **opts, if_not_exists: td.if_not_exists)` —
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:301,309-314`.

Correctly removing the short-circuit requires threading `if_not_exists` into
the trails `TableDefinition` / `schema_creation` so the DDL emits `CREATE
TABLE IF NOT EXISTS` (today `createTable` drops `ifNotExists` from `tdOpts`),
and iterating `td.indexes` with `ifNotExists`. This is create_table DDL work,
distinct from the introspection-collapse story.

## Acceptance criteria

- [ ] `MigrationContext#createTable` with `ifNotExists: true` emits `CREATE
TABLE IF NOT EXISTS` (threaded through TableDefinition/schema_creation)
      rather than short-circuiting in TS.
- [ ] Block-declared indexes are still created (with `ifNotExists`) when the
      table pre-exists, matching Rails.
- [ ] Test names match Rails verbatim.
