---
title: "loadSchema consults adapter.primaryKey so key-less data sources yield nil PK"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 120
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `e2-pg-ddl-via-exec` (RFC 0030). `Base.primaryKey` defaults to
`"id"` and `loadSchema` does not consult schema introspection for the actual
primary key. Rails sets `primary_key` to `nil` when
`connection.schema_cache.primary_keys(table_name)` returns nil — which is the
case for a foreign table (no PK constraint).

Blocks `adapters/postgresql/foreign-table.test.ts` test
`does not have a primary key` (Rails `foreign_table_test.rb`
`test_does_not_have_a_primary_key`), which asserts `ForeignProfessor.primary_key`
is nil for a model over a `CREATE FOREIGN TABLE` with no PK.

Closing this requires wiring `model-schema.loadSchema` to call
`adapter.primaryKey(tableName)` and store the result (including `null`) on
`_primaryKey`. Related: `primary-key-null-return-type-for-views` (RFC 0023, the
public-type-widening half).

## Acceptance criteria

- [ ] `loadSchema` consults `adapter.primaryKey(tableName)` and stores the
      result (incl. `null`) so a key-less data source yields a null primary key.
- [ ] Un-skip `does not have a primary key` in `foreign-table.test.ts`; it
      passes under PG (postgres_fdw gate permitting).
