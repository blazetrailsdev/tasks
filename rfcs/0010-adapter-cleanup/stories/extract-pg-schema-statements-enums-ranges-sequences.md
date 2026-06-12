---
title: "Extract PG enum/range/sequence statements from adapter into PostgreSQLSchemaStatements"
status: draft
updated: 2026-06-12
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: ["extract-pg-schema-statements-indexes-constraints"]
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

**This story:** the enum / range / sequence group — `createEnum`,
`dropEnum`, `renameEnum`, `addEnumValue`, `renameEnumValue`, `enumTypes`,
`createRange`, `dropRange`, `defaultSequenceName`, `serialSequence`,
`setPkSequenceBang`, `resetPkSequenceBang`, `pkAndSequenceFor`,
`primaryKeys`, plus table-introspection residue that belongs to the Rails
module (`tableOptions`, `tableComment`, `tablePartitionDefinition`,
`inheritedTableNames`) and remaining private helpers. Closes out the
extraction: after this story the adapter should hold no inline
schema-statements implementations.

## Acceptance criteria

- [ ] Listed methods live in `postgresql/schema-statements-class.ts`; the adapter only delegates.
- [ ] Adapter retains no inline implementation of any `SchemaStatements` interface method.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] Diff under the 500 LOC ceiling (pure motion; excluding `.md`).
