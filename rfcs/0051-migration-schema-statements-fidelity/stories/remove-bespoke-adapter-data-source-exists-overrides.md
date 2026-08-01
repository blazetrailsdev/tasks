---
title: "Remove the bespoke adapter dataSourceExists overrides and route through the converged base"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5787
claim: "2026-08-01T02:24:02Z"
assignee: "remove-bespoke-adapter-data-source-exists-overrides"
blocked-by: null
closed-reason: null
---

## Context

PR #5746 converged the base `SchemaStatements#dataSourceExists`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1569`)
onto Rails' shape: one untyped `dataSourceSql(name)` query plus a
`NotImplementedError` → `dataSources().includes(...)` fallback
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:44-48`).

The three concrete adapters still shadow it with bespoke catalog queries that
Rails does not have — Rails answers `data_source_exists?` from the base body for
every adapter, with only `data_source_sql` / `quoted_scope` overridden:

- `postgresql-adapter.ts:3506` → `pgSchemaStatements().dataSourceExists(name)`
- `sqlite3-adapter.ts:2098` → hand-written `pragma_table_list` query
- `mysql2-adapter.ts:1532` → `informationSchemaExists(name, null)`

Each already has a `dataSourceSql` override
(`sqlite3-adapter.ts:2054`, `abstract-mysql-adapter.ts:712`,
`postgresql-adapter.ts:4028`), so deleting the `dataSourceExists` overrides
should route every adapter through the now-converged base body. These overrides
were dormant until PR #5736 gave every `*_exists?` predicate one TS spelling, so
their behaviour differences (e.g. sqlite3's schema-qualified `aux.widgets`
branch, mysql2's `parseMysqlName` COALESCE shape) need diffing against what the
base + each `dataSourceSql` produces before removal.

## Acceptance criteria

- The adapter-level `dataSourceExists` overrides in postgresql-adapter.ts,
  sqlite3-adapter.ts and mysql2-adapter.ts are deleted (or reduced to what Rails
  actually overrides), with all callers reaching the base body.
- Any behaviour the overrides carried that the base + `dataSourceSql` path lacks
  is moved into the corresponding `dataSourceSql` / `quotedScope` override,
  which is where Rails puts it.
- Existing sqlite/pg/mysql schema-cache and schema-statements suites pass on all
  three adapters.
