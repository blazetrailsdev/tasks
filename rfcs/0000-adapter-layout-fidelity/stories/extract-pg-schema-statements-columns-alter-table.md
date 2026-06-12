---
title: "Extract PG column/alter-table statements into PostgreSQLSchemaStatements"
status: draft
updated: 2026-06-12
rfc: "0000-adapter-layout-fidelity"
cluster: adapter-layout
deps: ["extract-pg-schema-statements-indexes"]
deps-rfc: []
est-loc: 480
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` inlines
~1,600 lines of schema-management implementation (lines ~2,671–4,443) that
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

**This story (~250 moved lines):** `columns` (~112 lines),
`addColumn`, `changeColumn`, `renameColumn`, `changeColumnDefault`,
`changeColumnNull`, `buildChangeColumnDefinition`,
`buildChangeColumnDefaultDefinition`, `changeColumnComment`,
`changeTableComment`, `createJoinTable`, `columnNamesFromColumnNumbers`, and
`columnsForDistinct`. `typeToSql` moves only if Rails houses it in
`schema_statements.rb` — check placement first.

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] PR diff under the 500 LOC ceiling; if the group exceeds it, ship the slice that fits and register the remainder as a new story.
