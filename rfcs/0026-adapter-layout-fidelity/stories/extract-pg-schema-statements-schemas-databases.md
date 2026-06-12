---
title: "Extract PG schema/database/session statements into PostgreSQLSchemaStatements"
status: draft
updated: 2026-06-12
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` inlines
~2,000 lines of schema-management implementation (the 2,671–4,443 block plus the constraint methods at ~4,845–5,200) that
Rails keeps in `postgresql/schema_statements.rb`. The TS
`postgresql/schema-statements.ts` interface already covers all 95 Rails method
names; `postgresql/schema-statements-class.ts` holds only `dropTable`. This
story is pure code motion: move the listed group into
`PostgreSQLSchemaStatements` (or host-interface functions per the CLAUDE.md
mixin convention), leaving the adapter delegating. Verify each method's
placement against the Rails file — methods Rails keeps in the adapter (e.g.
the `extensions` family) stay put. Code motion counts double in the diff
(deletion + addition), so the group is sized to ~200–250 moved lines; if it
still exceeds the 500 LOC ceiling, ship the slice that fits and register the
remainder with `pnpm tasks new`.

**This story (~150 moved lines):** `createSchema`, `dropSchema`,
`schemaExists`, `schemaNames`, `currentSchema`, `schemaSearchPath` /
`setSchemaSearchPath`, `createDatabase`, `dropDatabase`, `recreateDatabase`,
`databaseExists`, `currentDatabase`, `encoding`, `collation`, `ctype`,
`clientMinMessages` / `setClientMinMessages`, plus private helpers they own
(e.g. `quoteSchemaName`).

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] PR diff under the 500 LOC ceiling; if the group exceeds it, ship the slice that fits and register the remainder as a new story.
