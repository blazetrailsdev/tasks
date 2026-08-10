---
title: "pg-schema-statements-abstract-signature-divergences"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6164
claim: "2026-08-07T01:28:29Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `pg-schema-statements-merged-interface-omits-nine-adapter-members`
(shipped the `getDatabaseVersion` half). That story's proposed converged shape —
`interface SchemaStatements extends Omit<PostgreSQLAdapter, ...>`, deleting the
trails-invented `PgSchemaAdapter` — was tried on that branch and does not
typecheck as a small change:

- Extending the real `PostgreSQLAdapter` type surfaces TS2320 "named property X
  of types 'SchemaStatements' and 'Omit<PostgreSQLAdapter, …>' are not
  identical" for **every** member whose PG signature differs from the one
  `AbstractSchemaStatements` inherits from `AbstractAdapter`. Iterating the
  error one name at a time got through `adapterName, addColumnForAlter,
addIndex, addIndexOptions, buildCreateIndexDefinition, buildStatementPool,
canPerformCaseInsensitiveComparisonFor, caseInsensitiveComparison, close,
configureConnection, createSchemaDumper, databaseVersion, disableExtension,
disableReferentialIntegrity, dumpSchemaInformation, enableExtension, explain,
extensions, …` and had not converged — the `Omit` list would end up far larger
  than the nine names it was meant to replace.

  That list IS the real finding: each entry is a PG override whose TS signature
  diverges from the abstract one it overrides. In Rails these are plain method
  overrides with compatible arity
  (`postgresql/schema_statements.rb`, `postgresql_adapter.rb` vs
  `abstract/schema_statements.rb`), so each divergence is its own fidelity bug.

- `columns`' `this.typeMap as HashLookupTypeMap` also survives: `AbstractAdapter`
  declares `typeMap` as an **accessor** (`abstract-adapter.ts:2543`), and
  TypeScript refuses to narrow an inherited accessor either from a merged
  interface member or from a `declare` field (TS2610). A real accessor override
  in the mixin module would shadow `PostgreSQLAdapter`'s own `type_map` once
  `include()` installs the module on its prototype. The cast now carries that
  reason at the call site.

## Acceptance criteria

- [ ] Converge the abstract/PG signature divergences the list above enumerates,
      so `SchemaStatements`' merged interface can extend the `PostgreSQLAdapter`
      type with a short `Omit`.
- [ ] `PgSchemaAdapter` (`postgresql/schema-statements-class.ts`) is deleted or
      reduced to the members `PostgreSQLAdapter` does not declare publicly
      (`query`, `quoteLiteral`, `_schemaSearchPathMemo`).
- [ ] `columns`' `as HashLookupTypeMap` is removed, or the TS2610 blocker is
      recorded as PERMANENT with the accessor cited.
- [ ] PG suite green; parity:api / parity:api:extra delta non-negative.
