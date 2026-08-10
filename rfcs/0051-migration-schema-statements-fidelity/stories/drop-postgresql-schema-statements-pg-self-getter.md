---
title: "Drop PostgreSQLSchemaStatements' self-returning pg getter"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 30
pr: 6117
claim: "2026-08-05T03:14:59Z"
assignee: "converge-context-set-defaults-remaining-three"
blocked-by: null
closed-reason: null
---

## Context

PR #5854 deleted `AbstractAdapter`'s `protected get adapter()` (which returned
`this`) and the `SchemaStatements` constructor, so the abstract bodies now call
plain `this` methods like Rails' module. `PostgreSQLSchemaStatements` still
carries the same idiom one level down:

- `packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:100`
  declares `private get pg(): PgSchemaAdapter { return this as unknown as PgSchemaAdapter; }`
  — a self-returning narrowing getter, exactly the shape #5854 removed from
  `AbstractAdapter`.
- ~30 call sites in that file reach PG-specific members through `this.pg.x(...)`
  (`this.pg.quoteIdentifier`, `this.pg.schemaCreation`, `this.pg.extractSchemaQualifiedName`,
  `this.pg.getDatabaseVersion`, …).

Rails' `PostgreSQL::SchemaStatements` calls these as plain `self` methods
(`activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`);
there is no `pg` receiver. The getter only exists because the merged
`interface SchemaStatements extends Omit<AbstractAdapter, …>` types `this` as
the _abstract_ adapter, so PG-only members do not resolve.

The fix is to give `PostgreSQLSchemaStatements` its own merged interface
(`export interface PostgreSQLSchemaStatements extends PostgreSQLAdapter {}` or a
`PgSchemaAdapter`-shaped one), then drop `pg` and rewrite `this.pg.x(...)` to
`this.x(...)`. Watch for the same member-shape conflicts #5854 hit — see
[[schema-statements-merged-interface-omits-conflicting-adapter-members]].

## Acceptance criteria

- `private get pg()` is gone from `postgresql/schema-statements-class.ts`.
- `this.pg.x(...)` reads `this.x(...)` at every site.
- No new self-returning narrowing getter replaces it.
- PG suite green; parity:api / parity:test delta non-negative.
