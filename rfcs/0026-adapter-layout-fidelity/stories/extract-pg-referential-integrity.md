---
title: "Extract PG disableReferentialIntegrity into its referential-integrity module"
status: done
updated: 2026-06-22
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: 3908
claim: "2026-06-22T18:27:57Z"
assignee: "extract-pg-referential-integrity"
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

**This story — referential integrity.** `disableReferentialIntegrity`
(adapter ~line 3843) and its `disableReferentialIntegritySql` helper. Note Rails
houses this in a **separate** module
`ActiveRecord::ConnectionAdapters::PostgreSQL::ReferentialIntegrity`
(`postgresql/referential_integrity.rb`), not `schema_statements.rb` — extract to
the mirrored `postgresql/referential-integrity*.ts` file (create it if absent,
matching the existing module layout), not into `PostgreSQLSchemaStatements`.

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters (sqlite/pg/mysql).
- [ ] PR diff under the 500 LOC ceiling; overflow registered as a new story, not a fanned-out PR.
- [ ] `wc -l postgresql-adapter.ts` drops by roughly the moved-line count.
