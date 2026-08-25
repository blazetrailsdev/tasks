---
title: "TableDefinition#setPrimaryKey re-runs and clears columns instead of Rails' single guarded call"
status: done
updated: 2026-08-03
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5993
claim: "2026-08-03T17:12:49Z"
assignee: "converge-set-primary-key-guard-and-single-invocation"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TableDefinition#set_primary_key` is guarded by `if id && !as` and runs
exactly once, on a fresh definition
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:395-410`).
A composite PK is spelled `create_table t, primary_key: [...]` with the default
`id`, and the guard then routes to `primary_keys(pk)`.

trails diverges in two linked ways, both surfaced while landing PR #5981:

1. `TableDefinition#setPrimaryKey`
   (`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1038-1050`)
   opens with a loop that splices every existing `options.primaryKey` column
   back off `this.columns`. Rails has no such loop — it exists only because
   trails calls `setPrimaryKey` twice: once from the `TableDefinition`
   constructor and again from
   `SchemaStatements#buildCreateTableDefinition`
   (`abstract/schema-statements.ts:1494-1503`, which passes `id: false` into the
   constructor and then re-runs the real arguments).

2. Both call sites carry `Array.isArray(primaryKey) ? true : id` to force the
   composite arm past Rails' `if id` guard, because trails callers spell a
   composite PK as `id: false, primaryKey: [...]` where Rails spells it
   `primary_key: [...]`. Under Rails' own guard `id: false` would skip
   `set_primary_key` entirely.

PR #5981 converged `primary_keys` itself onto Rails' setter/reader pair
(`schema_definitions.rb:121,412-415`), which makes the remaining shim visible:
the definition is now capable of receiving a composite PK after construction,
so the double-invocation dance is no longer load-bearing.

## Converged shape

- `buildCreateTableDefinition` constructs the definition with the caller's real
  `id` / `primaryKey`, so `setPrimaryKey` runs once, from the constructor, as in
  Rails.
- Delete the column-clearing loop at `schema-definitions.ts:1038-1050`.
- Drop both `Array.isArray(primaryKey) ? true : id` overrides and honour Rails'
  `if (id && !this.as)` guard, migrating trails callers that spell a composite
  PK as `id: false, primaryKey: [...]` to Rails' `primaryKey: [...]`.

## Acceptance criteria

- [ ] `setPrimaryKey` matches `schema_definitions.rb:395-410` line for line:
      the `if id && !as` guard, no column-clearing loop, one invocation per
      definition.
- [ ] `buildCreateTableDefinition` no longer passes `id: false` and re-runs
      `setPrimaryKey`.
- [ ] Composite-PK create-table and schema dumps unchanged on all three
      adapters.
