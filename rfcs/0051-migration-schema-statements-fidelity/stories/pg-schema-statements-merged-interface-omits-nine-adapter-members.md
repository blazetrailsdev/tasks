---
title: "Shrink PostgreSQLSchemaStatements' nine-name Omit list and drop its two narrowing casts"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6128
claim: "2026-08-05T14:47:37Z"
assignee: "resolve-last-activerecord-inheritance-mismatch-schema-dumper"
blocked-by: null
closed-reason: null
---

## Context

PR #6117 dropped `PostgreSQLSchemaStatements`' self-returning `pg` getter and gave
the class a declaration-merged interface over `PgSchemaAdapter`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:98-127`).
Nine names had to be `Omit`ted from it:

    execute, internalExecute, getDatabaseVersion, lookupCastTypeFromColumn,
    schemaCreation, quotedScope, typeMap, logger, nativeDatabaseTypes

Each already reaches `this` from `AbstractSchemaStatements`/`AbstractAdapter`
with a wider signature, and TypeScript resolves a base-class method or accessor
ahead of a merged-interface property — so the narrower PG restatement is
unreachable. Two bodies now carry a local cast to get the PG type back:

- `resetPkSequenceBang`: `(await this.getDatabaseVersion()) as number` — PG's
  own reader returns `server_version_num`, the base types it `number | Version`.
- `columns`: `this.typeMap as HashLookupTypeMap` — `AbstractAdapter.typeMap` is
  `get typeMap(): unknown` (`abstract-adapter.ts:2530`).

Rails has neither cast: `PostgreSQL::SchemaStatements` calls `self.type_map`,
`self.get_database_version` and gets the PG overrides by ordinary method lookup
(`activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`,
`postgresql_adapter.rb`). The casts are pure TypeScript tax and they hide a real
type error if a PG override is ever removed.

`PgSchemaAdapter` itself (same file, :34-92) is trails-invented surface with no
Rails counterpart — it now exists only as the `Omit` source, duplicating names
`export interface PostgreSQLAdapter` (`postgresql-adapter.ts:4603`) already
declares.

## Converged shape

Narrow the members on the declaring side instead of restating them downstream:
have `PostgreSQLAdapter` declare `typeMap`/`getDatabaseVersion`/`execute` etc.
at their PG types (the class already implements them that way), so the merged
`SchemaStatements` interface can extend the adapter directly with an empty or
near-empty `Omit`, both local casts disappear, and `PgSchemaAdapter` is deleted
in favour of the `PostgreSQLAdapter` interface.

Sibling precedent: `schema-statements-merged-interface-omits-conflicting-adapter-members`
(RFC 0051, done) hit the same conflict class one level up.

## Acceptance criteria

- [ ] The `Omit` list on `interface SchemaStatements` shrinks to the members
      TypeScript genuinely cannot express, each with its reason at the call site.
- [ ] `resetPkSequenceBang`'s `as number` and `columns`' `as HashLookupTypeMap`
      are gone.
- [ ] `PgSchemaAdapter` is deleted, or reduced to names `PostgreSQLAdapter` does
      not already declare.
- [ ] PG suite green; parity:api / parity:api:extra delta non-negative.
