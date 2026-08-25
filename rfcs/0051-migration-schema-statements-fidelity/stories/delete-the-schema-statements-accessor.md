---
title: "delete-the-schema-statements-accessor"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5841
claim: "2026-08-02T00:06:04Z"
assignee: "delete-the-schema-statements-accessor"
blocked-by: null
closed-reason: null
---

## Context

`remove-schema-statements-dispatch-shim-companion-mixin-duality` made
`AbstractAdapter#schemaStatements()` return the adapter itself:

```ts
schemaStatements(): SchemaStatements {
  return this as unknown as SchemaStatements;
}
```

It is now an identity function. Rails has no such accessor at all — `include
SchemaStatements` (`abstract_adapter.rb`) puts the bodies on the adapter and
callers just say `connection.create_table(...)`. The accessor's
`@noRailsEquivalent PERMANENT` justification ("TypeScript has no `include`") no
longer holds: `include(AbstractAdapter, SchemaStatements)` does the work, and the
accessor adds a hop that hides which object is really being called.

Call sites are mechanical — `this.schemaStatements().x(...)` → `this.x(...)` —
and live in `sqlite3-adapter.ts`, `abstract-mysql-adapter.ts`,
`postgresql-adapter.ts`, `support/canonical-schema.ts`,
`support/setup-second-pool.ts`, `support/fake-adapter.ts`, `migration.ts` and
roughly 25 test files.

## Acceptance criteria

- `AbstractAdapter#schemaStatements` is deleted, along with its
  `@noRailsEquivalent` entry.
- Every `schemaStatements()` call site calls the adapter member directly. Where
  the member is missing from AbstractAdapter's mixin declaration-merged
  interface, add the signature there rather than casting at the call site.
- `Migration`'s `conn.schemaStatements ? … : new SchemaStatements(conn)` fallback
  (`migration.ts:331`, `:1736`) resolves to the connection itself.
- `support/stubbed-ddl-methods.test.ts` recorded a module view through
  `schemaStatements`; re-point its proxy at whatever boundary survives and keep
  the floor assertions honest.
- Likely more than one PR at the 500-LOC ceiling — split src and tests, each
  from `main` with non-overlapping files.
