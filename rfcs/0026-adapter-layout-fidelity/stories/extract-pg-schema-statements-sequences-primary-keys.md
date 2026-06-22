---
title: "Extract PG sequence/primary-key statements into PostgreSQLSchemaStatements"
status: ready
updated: 2026-06-15
rfc: "0026-adapter-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 20
pr: null
claim: null
assignee: null
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

**This story — sequence + primary-key methods** still inline in the adapter:
`defaultSequenceName`, `serialSequence`, `sequenceNameFromParts`,
`setPkSequence`, `setPkSequenceBang`, `resetPkSequence`, `resetPkSequenceBang`,
`pkAndSequenceFor`, `primaryKey`, `primaryKeys`. (The earlier
enums-ranges-sequences story moved the enum/range group; these PK/sequence
methods remain.) Mirror the Rails `postgresql/schema_statements.rb` sequence and
primary-key sections.

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters (sqlite/pg/mysql).
- [ ] PR diff under the 500 LOC ceiling; overflow registered as a new story, not a fanned-out PR.
- [ ] `wc -l postgresql-adapter.ts` drops by roughly the moved-line count.
