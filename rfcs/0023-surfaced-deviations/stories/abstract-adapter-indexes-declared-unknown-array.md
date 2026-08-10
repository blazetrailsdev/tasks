---
title: "AbstractAdapter#indexes is declared unknown[] instead of IndexDefinition[]"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity divergence: unknown[] vs IndexDefinition[] is a TS declaration-type narrowing; runtime behaviour already matches Rails SchemaStatements#indexes."
---

## Context

`AbstractAdapter#indexes` is declared `indexes(tableName: string): Promise<unknown[]>`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:366`). Rails'
`SchemaStatements#indexes` returns an array of `IndexDefinition`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`),
and our own `SchemaStatements`/dialect adapters do produce that shape — the
concrete type is simply lost at the `AbstractAdapter` interface boundary.

Surfaced while routing MigrationContext DSL callers onto the adapter (PR #5793):
`MigrationContext#indexes` had been narrowing internally
(`migration.ts:2084-2087` casts `this.connection.indexes(...)` to the concrete
type), so callers that moved off it now have to re-cast at the call site.
`packages/activerecord/src/timestamp.test.ts` ("index is created for both
timestamps") carries one such cast today, and every future caller of
`connection.indexes(...)` inherits the same tax.

## Acceptance criteria

- `AbstractAdapter#indexes` is declared with the concrete `IndexDefinition[]`
  element type rather than `unknown[]`, matching what the implementations
  already return.
- The `as { columns: string[] }[]` cast in `timestamp.test.ts` is removed.
- No dialect adapter override trips TS2425; `pnpm parity:api` deltas
  non-negative.
