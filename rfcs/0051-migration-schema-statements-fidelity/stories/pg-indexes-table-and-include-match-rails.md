---
title: "PG indexes() uses the tableName argument and an empty include array"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5888
claim: "2026-08-02T15:35:18Z"
assignee: "pg-indexes-table-and-include-match-rails"
blocked-by: null
closed-reason: null
---

## Context

Rails' PostgreSQL `indexes()`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:136-150`)
builds `IndexDefinition.new(table_name, ...)` from the **argument** and passes
`include: include_columns`, where `include_columns` is `[]` when the definition
has no INCLUDE clause.

trails' `PostgreSQLSchemaStatements#indexes`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:218`)
instead passes `row.table_name` — the bare `pg_class.relname` — so a
schema-qualified call like `indexes("myschema.posts")` yields `table: "posts"`
where Rails yields `"myschema.posts"`. It also leaves `include` `undefined`
rather than `[]`.

Neither is currently observable: `isDefinedFor` normalizes `include` via
`?? []`, and no consumer reads `table` off a PG index. Both are one-line
convergences with a low blast radius.

## Acceptance criteria

- PG `indexes()` passes the `tableName` argument as the `IndexDefinition` table,
  matching `postgresql/schema_statements.rb:137`.
- `include` is `[]` (not `undefined`) when the index has no INCLUDE clause,
  matching `include_columns` at `:114`.
- A test covers the schema-qualified `indexes("schema.table")` table value.
