---
title: "Extract PG foreign-key statements into PostgreSQLSchemaStatements"
status: in-progress
updated: 2026-06-15
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: ["extract-pg-schema-statements-alter-table"]
deps-rfc: []
est-loc: 480
priority: null
pr: 3331
claim: "2026-06-15T11:50:09Z"
assignee: "extract-pg-schema-statements-fks"
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` inlines
~2,000 lines of schema-management implementation (the 2,671–4,443 block plus
the constraint methods at ~4,845–5,200) that Rails keeps in
`postgresql/schema_statements.rb`. The TS `postgresql/schema-statements.ts`
interface already covers all 95 Rails method names;
`postgresql/schema-statements-class.ts` holds only `dropTable`. This story is
pure code motion: move the listed group into `PostgreSQLSchemaStatements` (or
host-interface functions per the CLAUDE.md mixin convention), leaving the
adapter delegating. Code motion counts double in the diff (deletion +
addition), so the group is sized to ~200–250 moved lines; if it still exceeds
the 500 LOC ceiling, ship the slice that fits and register the remainder with
`pnpm tasks new`.

**This story (~250 moved lines):** `foreignKeys` (~49),
`addForeignKey`, `foreignKeyExists` (~53), `foreignKeyColumnFor`,
`checkAllForeignKeysValidBang`, `validateConstraint`,
`validateCheckConstraint`, `validateForeignKey`, and the extract helpers
`assertValidDeferrable`, `extractForeignKeyAction`,
`extractConstraintDeferrable`. `disableReferentialIntegrity` is confirmed to
live in Rails' `postgresql/referential_integrity.rb` — move it to the mirrored
`postgresql/referential-integrity.ts`, not to schema-statements.

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] PR diff under the 500 LOC ceiling; if the group exceeds it, ship the slice that fits and register the remainder as a new story.
