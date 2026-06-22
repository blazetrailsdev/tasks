---
title: "Extract PG unique-constraint statements into PostgreSQLSchemaStatements"
status: in-progress
updated: 2026-06-22
rfc: "0026-adapter-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 20
pr: 3911
claim: "2026-06-22T18:51:57Z"
assignee: "extract-pg-schema-statements-unique-constraints"
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` (~5,270
lines) still inlines schema-management implementation that Rails keeps in
`postgresql/schema_statements.rb`. The TS `postgresql/schema-statements.ts`
interface already declares the Rails method names and
`postgresql/schema-statements-class.ts` (`PostgreSQLSchemaStatements`) holds the
extracted implementations. This story is **pure code motion**: move the listed
methods out of the adapter into `PostgreSQLSchemaStatements` (or host-typed
functions per the CLAUDE.md mixin convention), leaving the adapter delegating.
Verify each method's placement against the Rails file — methods Rails keeps in
the adapter stay put. Code motion counts double against the 500 LOC ceiling
(deletion + addition); if a group exceeds it, ship the slice that fits and
register the remainder with `pnpm tasks new`.

**This story — unique-constraint methods** (still inline in the adapter around
lines 4377–4760): `uniqueConstraintOptions`, `uniqueConstraintName`,
`uniqueConstraints`, `uniqueConstraintFor`, `uniqueConstraintForBang`, plus the
`addUniqueConstraint` / `removeUniqueConstraint` mutators if still adapter-local.
Mirror Rails `postgresql/schema_statements.rb` unique-constraint group.

## Acceptance criteria

- [x] Listed methods live in the mirrored module file; the adapter only delegates.
- [x] No behavior change: no test edits beyond import paths; CI green on all three adapters (sqlite/pg/mysql).
- [x] PR diff under the 500 LOC ceiling; overflow registered as a new story, not a fanned-out PR.
- [x] `wc -l postgresql-adapter.ts` drops by roughly the moved-line count.
