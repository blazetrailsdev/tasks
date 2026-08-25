---
title: "Give updateTableDefinition one Rails-shaped home per adapter"
status: done
updated: 2026-07-30
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5639
claim: "2026-07-30T14:02:20Z"
assignee: "update-table-definition-single-home-per-adapter"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #5626 (`migration-change-table-yields-adapter-table`).

Rails defines `update_table_definition` once per adapter, in the
`SchemaStatements` module that the adapter includes —
`abstract/schema_statements.rb:1472`, `postgresql/schema_statements.rb:880`,
`mysql/schema_statements.rb:103`.

trails splits the homes: the abstract one is on the `SchemaStatements` companion
class (`connection-adapters/abstract/schema-statements.ts:1977`), but the PG and
MySQL overrides sit on the **adapter** classes
(`postgresql-adapter.ts:4731`, `abstract-mysql-adapter.ts:271`) rather than on
`PostgreSQLSchemaStatements` / `MysqlSchemaStatements`. `Migration#schema`
returns the companion, so `Migration#changeTable` cannot simply call
`this.schema.updateTableDefinition(...)` — #5626 had to probe the connection for
the method and fall back to the companion:

```ts
const delegate = this.connection as unknown as {
  updateTableDefinition?(tableName: string, base: unknown): Table;
};
const table = delegate.updateTableDefinition
  ? delegate.updateTableDefinition(tableName, this)
  : this.schema.updateTableDefinition(tableName, this);
```

That optional-probe dispatch has no Rails counterpart, and `SchemaStatements#changeTable`
(:1061) still yields the abstract `Table` for any caller that goes through the
companion.

## Acceptance criteria

- `updateTableDefinition` has one home per adapter, matching the Rails file
  layout: the PG/MySQL overrides live on their `SchemaStatements` companion
  classes, reachable from both `SchemaStatements#changeTable` and
  `Migration#changeTable`.
- `Migration#changeTable` calls it unconditionally — the optional-probe fallback
  is deleted.
- No duplicate definition survives on the adapter classes (or, if adapter-level
  access is needed, it delegates rather than re-implementing).
- `migration.trails.test.ts` "changeTable yields the adapter's
  updateTableDefinition result" still passes; add companion-level coverage that
  `connection.changeTable` yields the adapter subclass.
- `parity:api` / `parity:test` deltas non-negative.
