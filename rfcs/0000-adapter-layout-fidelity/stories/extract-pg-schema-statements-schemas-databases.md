---
title: "Extract PG schema/database/search-path statements from adapter into PostgreSQLSchemaStatements"
status: draft
updated: 2026-06-12
rfc: "0000-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` inlines
~1,800 lines of schema-management implementation (roughly lines 2,671–4,443)
that Rails keeps in a separate mixin module,
`activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`.
The TS destination files already exist:
`postgresql/schema-statements.ts` holds the (complete) `SchemaStatements`
interface — all 95 Rails method names are covered — and
`postgresql/schema-statements-class.ts` holds `PostgreSQLSchemaStatements
extends SchemaStatements` with only `dropTable` so far. This is pure code
motion: move implementations out of `PostgreSQLAdapter` into
`PostgreSQLSchemaStatements` (or host-interface functions per the repo mixin
convention), leaving the adapter delegating. No behavior change; existing
tests are the safety net. The three extraction stories touch the same two
files, so they are dependency-chained and must ship sequentially from `main`
(no stacking).

**This story:** the schema/database/session group — `createDatabase`,
`dropDatabase`, `recreateDatabase`, `createSchema`, `dropSchema`,
`schemaExists`, `schemaNames`, `currentSchema`, `schemaSearchPath` /
`setSchemaSearchPath`, `currentDatabase`, `encoding`, `collation`, `ctype`,
`clientMinMessages` / `setClientMinMessages`, plus their private helpers
(e.g. `parseSchemaQualifiedName`, `quoteSchemaName`).

## Acceptance criteria

- [ ] Listed methods live in `postgresql/schema-statements-class.ts` (or host-interface functions in `postgresql/schema-statements.ts`); the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] Diff under the 500 LOC ceiling (pure motion; excluding `.md`).
