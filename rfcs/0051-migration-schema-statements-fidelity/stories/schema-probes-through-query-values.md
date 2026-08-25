---
title: 'Route abstract SchemaStatements catalog probes through queryValues(sql, "SCHEMA")'
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5846
claim: "2026-08-02T00:31:03Z"
assignee: "schema-probes-through-query-values"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `dataSources` (PR #5807).

Rails' schema introspection reads catalogs through
`query_values(sql, "SCHEMA")`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:108-110`
— `query(...).map(&:first)`, i.e. positional first-column projection over
array rows).

trails routes the same probes through `this.adapter.schemaQuery(sql)`, which
returns `Record<string, unknown>[]`, so every call site re-derives the first
column by hand — `Object.values(row)[0]` in `dataSources`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1618`),
`rows.length > 0` in `dataSourceExists` just below, and named-key projections
(`r.name ?? r.TABLE_NAME`) in `tables()` / `views()` in the same file.

A `queryValues` already exists and is faithful
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:469`)
and is used by the PostgreSQL adapter, but the abstract SchemaStatements probes
do not use it. The wide call-mismatch baseline still carries
`data_sources` → `query_values` for exactly this reason
(`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-statements.json`).

## Acceptance criteria

- Abstract SchemaStatements catalog probes read through `queryValues(sql, "SCHEMA")`
  rather than `schemaQuery` + ad-hoc first-column extraction, matching Rails.
- The `"SCHEMA"` query name is passed (it is currently dropped), so the probes
  log as SCHEMA statements like Rails.
- The `data_sources` → `query_values` wide baseline entry is removed once it
  converges.
- No behaviour change for adapters: existing schema-cache / schema-statements
  suites pass on sqlite, pg and mysql.
