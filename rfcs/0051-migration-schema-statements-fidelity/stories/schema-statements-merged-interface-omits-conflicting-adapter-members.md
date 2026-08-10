---
title: "Converge the member shapes the SchemaStatements merged interface has to Omit"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 20
pr: 6116
claim: "2026-08-05T03:00:02Z"
assignee: "fold-narrow-call-ratchet-into-wide"
blocked-by: null
closed-reason: null
---

## Context

PR #5854 replaced the `SchemaStatements` companion-class constructor with a
merged interface so the bodies can call plain `this` methods:

```ts
export interface SchemaStatements
  extends
    Omit<
      DatabaseAdapter,
      | "addColumns"
      | "currentDatabase"
      | "createEnum"
      | "dropEnum"
      | "renameEnum"
      | "addEnumValue"
      | "renameEnumValue"
    >,
    SchemaQuoter {}
```

(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:288`)

Every name in that `Omit` list is there because `SchemaStatements` and
`AbstractAdapter` declare the _same_ member with incompatible shapes, so the
declaration merge does not typecheck:

- `addColumns` — `AbstractAdapter` takes `...columns: { name; type; options }[]`,
  `SchemaStatements` takes Rails' `(tableName, *columnNames, type_and_options)`
  trailing-hash varargs. At most one of these matches
  `schema_statements.rb#add_columns`.
- `currentDatabase`, `createEnum`, `dropEnum`, `renameEnum`, `addEnumValue`,
  `renameEnumValue` — declared as instance _properties_ on `AbstractAdapter` but
  as methods on the PostgreSQL subclass, which TS rejects across the merge
  (TS2425).

Each is a real divergence hiding behind a type-level escape hatch: the `Omit`
means the abstract bodies get no typing for those members at all. Converge the
signatures against Rails and the `Omit` list should shrink to nothing.

## Acceptance criteria

- `addColumns` has one signature, matching Rails'
  `add_columns(table_name, *column_names, type:, **options)`.
- The enum/`currentDatabase` members are declared as methods (not properties) on
  whichever class owns them, matching Rails.
- The `Omit<...>` in the merged interface is empty or gone.
- parity:api / parity:test delta non-negative; all lanes green.
