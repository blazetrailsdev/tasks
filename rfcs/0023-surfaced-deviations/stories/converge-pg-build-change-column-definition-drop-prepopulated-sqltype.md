---
title: "Converge PG buildChangeColumnDefinition: drop pre-populated sqlType to match Rails"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3978
claim: "2026-06-23T11:52:43Z"
assignee: "converge-pg-build-change-column-definition-drop-prepopulated-sqltype"
blocked-by: null
---

## Context

PR #3903 converged PG `buildChangeColumnDefinition`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:878`)
to route through `createTableDefinition(tableName).newColumnDefinition(...)`,
mirroring Rails `PostgreSQL::SchemaStatements#build_change_column_definition`
(`postgresql/schema_statements.rb:478`).

Rails leaves `sql_type` **unset** in the builder — the visitor
(`visit_ChangeColumnDefinition`) computes it on `accept`. trails diverges: it
pre-populates `cd.sqlType = this.typeToSql(cd.type, cd.options)` purely to keep
the builder's standalone return value self-describing for a bespoke unit test
(`postgresql-adapter.test.ts:1049` "returns a ChangeColumnDefinition with
correct column name and sqlType"). The visitor recomputes identically so emitted
DDL is unaffected, but the in-memory deviation remains.

## Acceptance criteria

- [ ] Drop the `cd.sqlType = ...` assignment in PG
      `buildChangeColumnDefinition` so it matches Rails (builder leaves
      `sql_type` for the visitor).
- [ ] Update the bespoke unit test that asserts builder-set `sqlType` — either
      assert against the visited DDL output, or remove the `sqlType` assertion —
      without renaming the test.
- [ ] CI green on all three adapters.
