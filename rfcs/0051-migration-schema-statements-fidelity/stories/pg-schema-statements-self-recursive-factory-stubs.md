---
title: "PG SchemaStatements carries two self-recursive factory stubs Rails has no counterpart for"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6170
claim: "2026-08-07T12:48:31Z"
assignee: "database-tasks-config-is-a-second-store-beside-base-configurations"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while working `pg-schema-statements-abstract-signature-divergences`
(PR #6164).

`postgresql/schema-statements-class.ts:859-868` carries two overrides that call
themselves:

```ts
override createTableDefinition(
  name: string,
  options: Record<string, unknown> = {},
): AbstractTableDefinition {
  return this.createTableDefinition(name, options);
}

override createAlterTable(name: string): AlterTable {
  return this.createAlterTable(name);
}
```

Both are unbounded self-recursion as written. They never blow the stack only
because `include()` preserves class-body methods over mixin ones
(`activesupport/src/include.ts`, the `includedKeys` registry), so
`PostgreSQLAdapter`'s own `createTableDefinition` (`postgresql-adapter.ts:4257`)
and `createAlterTable` (`:4266`) are the ones actually on the prototype and these
bodies are dead. Their only effect is on the _type_ of `this` inside the module —
the comment above them says as much ("Route the schema-definition factories back
through the adapter…").

Rails has no such members in `postgresql/schema_statements.rb`. They are pure
trails invention, and a latent stack-overflow if `include()`'s precedence ever
changes or if the class is used without the adapter.

## Converged shape

Delete both. PR #6164 replaced the hand-written `PgSchemaAdapter` with
`Pick<PostgreSQLAdapter, …>`, which is the right place to get the PG-typed
factories: add `createTableDefinition` / `createAlterTable` to that `Pick` list
if the bodies in this file need the PG return types, and drop the stubs. Note
they are currently _absent_ from the `Pick` precisely because the class-declared
stubs win; removing the stubs is what makes adding them to the `Pick` possible.

Check `changeColumn` and the `addColumn` path in this file, which were the
callers the stubs' comment was written for.

## Acceptance criteria

- [ ] `createTableDefinition` / `createAlterTable` no longer declared in
      `postgresql/schema-statements-class.ts`.
- [ ] The PG-typed factories reach the bodies through the merged interface.
- [ ] `pnpm typecheck` green, `parity:api:extra --package activerecord` delta
      non-negative, PG lane green.
