---
title: "sqlite3: put alterTable's block argument last, as Rails' alter_table does"
status: in-progress
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5607
claim: "2026-07-29T21:48:01Z"
assignee: "sqlite-alter-table-block-argument-goes-last"
blocked-by: null
closed-reason: null
---

## Context

Rails' `alter_table` is
`alter_table(table_name, foreign_keys = foreign_keys(table_name), check_constraints = check_constraints(table_name), **options, &block)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:561-565`) —
the block is last and implicit.

trails' private `alterTable`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2342`)
takes the block **second**:
`alterTable(tableName, block?, overrideForeignKeys?, overrideCheckConstraints?, options?)`.
That order arrived with PR #5528 and was kept by PR #5529, which appended
`options` (carrying `rename`) after the override arguments.

Raised in review on PR #5529: a reader coming from Rails expects the callback
last, and every call site that wants only `rename` currently threads
`undefined, undefined, undefined` past the block slot.

## Acceptance criteria

- [ ] `alterTable`'s parameters are ordered
      `(tableName, overrideForeignKeys?, overrideCheckConstraints?, options?, block?)`,
      matching Rails' `alter_table`.
- [ ] All call sites updated: `addColumn`, `removeColumn`, `removeColumns`,
      `changeColumnDefault`, `changeColumnNull`, `changeColumn`, `renameColumn`,
      `addForeignKey`, `removeForeignKey`, `addCheckConstraint`,
      `removeCheckConstraint`, plus the direct call in
      `sqlite3-copy-table.test.ts`.
- [ ] `migration/foreign-key.test.ts`, `sqlite3-copy-table.test.ts` and the
      SQLite adapter suites stay green; no behaviour change.
