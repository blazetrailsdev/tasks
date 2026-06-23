---
title: "Converge PG addUniqueConstraint through create_alter_table/schema_creation"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3977
claim: "2026-06-23T11:47:40Z"
assignee: "converge-pg-add-unique-constraint-via-alter-table"
blocked-by: null
---

## Context

trails' `PostgreSQLSchemaStatements.addUniqueConstraint`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`)
builds the `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE ...` SQL inline. Rails'
`add_unique_constraint` (vendor/rails/.../postgresql/schema_statements.rb:796)
instead routes through `create_alter_table` + `at.add_unique_constraint(...)` +
`execute schema_creation.accept(at)`, so the UNIQUE clause (incl. NULLS NOT
DISTINCT, USING INDEX, deferrable) is rendered by the schema-creation visitor.
This deviation predates the code-motion PR #3911 (which only relocated the
method verbatim) and was deliberately left out of scope there.

## Acceptance criteria

- [ ] `addUniqueConstraint` builds the constraint via `createAlterTable` and
      `schemaCreation.accept`, matching Rails' control flow.
- [ ] Emitted SQL is byte-identical to today for all paths (columns, usingIndex,
      nullsNotDistinct, deferrable); no test edits beyond what convergence requires.
- [ ] api:compare / test:compare delta non-negative on all three adapters.
