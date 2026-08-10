---
title: "Converge the three set_primary_key deviations: PrimaryKeyDefinition, PK-strip loop, composite id:false spelling"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: PrimaryKeyDefinition is ported and visited (abstract/schema-creation.ts:23,162), primaryKeys() is Rails' reader/writer (schema-definitions.ts:1063-1066), setPrimaryKey keeps the bare `if (!id || this.as) return` guard with no PK-strip loop (:1039), and canonical-schema.ts:296-302 stops passing `id: false` alongside a composite primaryKey."
---

## Context

PR #5629 converged `TableDefinition#setPrimaryKey` onto Rails'
`set_primary_key` body
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:395-410`).
Three deviations survived, each carrying a one-line reason at the call site in
`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`
and `.../schema-statements.ts`. They are related enough to converge together.

1. **Composite PK is not a `PrimaryKeyDefinition`.** Rails' array branch is
   `primary_keys(pk)`, whose writer form is
   `@primary_keys = PrimaryKeyDefinition.new(name)`. Trails has no
   `PrimaryKeyDefinition`; the array is stashed on a `compositePrimaryKey`
   field and trails' `primaryKeys(name?)` is a _reader_ over the built columns
   with unrelated semantics. Converging means porting `PrimaryKeyDefinition`,
   flipping `primaryKeys` to Rails' reader/writer shape, and updating the
   SchemaCreation visitors that read `compositePrimaryKey`.

2. **`setPrimaryKey` strips pre-existing PK columns first.** Rails has no such
   loop — its `set_primary_key` only ever runs on a fresh definition. Trails
   also re-runs it over a definition rebuilt from an existing table (SQLite's
   copy-table path), which already carries the old PK, so without the strip the
   rebuilt table gets two PK columns. Removing the loop means fixing the
   copy-table path to build a fresh definition instead.

3. **A composite `primaryKey` overrides `id: false`.** Rails guards on `if id`,
   so `create_table id: false, primary_key: [...]` would emit no PK at all.
   Trails' callers — including the canonical schema loader at
   `packages/activerecord/src/support/canonical-schema.ts:271-275`, which sets
   `createOpts.id = false` whenever `meta.primaryKey` is present — spell a
   composite PK exactly that way, so `buildCreateTableDefinition` forces the id
   argument true when `primaryKey` is an array. Converging means changing the
   loader (and `test-schema.ts`'s `primaryKey: [...]` convention) to stop
   passing `id: false` alongside a composite PK.

There is also a smaller one: `buildCreateTableDefinition` appends
`"autoIncrement"` to `this.validPrimaryKeyOptions()` at the call site, because
Rails' base list is `[:limit, :default, :precision]` and `auto_increment` is
MySQL's addition — but trails' `createTable` has always accepted it
dialect-agnostically. Either push it into the MySQL override only, or document
it as intended.

## Acceptance criteria

- `PrimaryKeyDefinition` ported and `primaryKeys` given Rails' reader/writer
  shape, with `compositePrimaryKey` consumers migrated.
- The PK-strip loop deleted, with SQLite's copy-table path building a fresh
  definition so the rebuilt table still gets exactly one PK.
- The composite-PK `id: false` spelling removed from the canonical loader and
  `test-schema.ts`, so `setPrimaryKey` can keep Rails' bare `if id` guard.
- `autoIncrement` either confined to the MySQL `validPrimaryKeyOptions()`
  override or documented as an intended trails extra.
- Tests assert the composite PK reaches the emitted DDL, and each fails on the
  pre-fix implementation.
- No regression in `pnpm parity:api:calls` (baseline only shrinks).
