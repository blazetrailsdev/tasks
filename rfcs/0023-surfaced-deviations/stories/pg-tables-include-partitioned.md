---
title: "PG tables() omits partitioned tables (relkind p) vs Rails data_source_sql BASE TABLE"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during PR #3291 (extract-pg-schema-statements-tables-introspection).

`PostgreSQLSchemaStatements#tables` (now in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`)
queries:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = ANY(current_schemas(false)) ORDER BY tablename
```

`pg_tables` lists only ordinary tables, so partitioned tables (`relkind = 'p'`)
are excluded. Rails builds the list via `data_source_sql(type: "BASE TABLE")`
which queries `pg_class` with `relkind IN ('r','p')` and thus includes
partitioned tables — see
`activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`
(`#tables` / `#data_source_sql` / `#quoted_scope`, ~lines 1118–1141 in the
pinned Rails checkout).

Pre-existing divergence (not introduced by #3291, which was pure code motion).
Track here for fidelity. Fix is to reimplement `tables()` over `pg_class` using
the existing `dataSourceSql(name, { type: "BASE TABLE" })` helper, matching
Rails, and verify partitioned-table coverage.

## Acceptance criteria

- [ ] `tables()` returns partitioned tables (`relkind = 'p'`) in addition to ordinary tables, matching Rails.
- [ ] Implementation routes through the `dataSourceSql`/`quotedScope` BASE TABLE path rather than `pg_tables`.
- [ ] Test covering a partitioned table appears in `tables()`; CI green on all three adapters.
