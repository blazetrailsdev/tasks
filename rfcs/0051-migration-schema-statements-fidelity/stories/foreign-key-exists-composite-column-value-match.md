---
title: "foreignKeyExists must match composite array column/primaryKey by value"
status: ready
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4766 widened `AddForeignKeyOptions.column`/`.primaryKey` to
`string | string[]`, so composite (array) `column` values are now well-typed on
every FK API. But `SchemaStatements#foreignKeyExists` (the `ifNotExists` branch)
still matches columns with scalar `===`:

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:797`

```ts
fk.toTable === toTable && (options.column == null || fk.column === options.column);
```

When `options.column` is an array, `fk.column === options.column` is a reference
comparison — always false for distinct array instances — so a matching composite
FK is never detected and `ifNotExists` fails to suppress a duplicate add.

Rails matches via `foreign_keys(from).detect { |fk| fk.defined_for?(...) }`,
and `ForeignKeyDefinition#defined_for?` compares `column`/`primary_key`
element-wise (arrays compared by value), not by identity — see
`vendor/rails/activerecord/lib/active_record/connection_adapters/foreign_key_definition.rb`
and `add_foreign_key`'s `if_not_exists` path in
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`.

Our `ForeignKeyLookupOptions`/`foreignKeyFor`/`isDefinedFor` already model
`column: string | string[]` and array-aware matching exists there; the
`foreignKeyExists` inline `===` predicate simply bypasses it.

## Acceptance criteria

- [ ] `SchemaStatements#foreignKeyExists` (schema-statements.ts:~797) matches a
      composite `column`/`primaryKey` array by value, not reference — route
      through the existing `foreignKeyFor`/`isDefinedFor` array-aware path
      rather than an inline `===`.
- [ ] Add a test: `add_foreign_key ..., if_not_exists: true` with a composite
      `column: [...]` that already exists is a no-op (does not raise / does not
      duplicate). Mirror the Rails test name if one exists.
- [ ] api:compare / test:compare delta non-negative; no test-name changes.
