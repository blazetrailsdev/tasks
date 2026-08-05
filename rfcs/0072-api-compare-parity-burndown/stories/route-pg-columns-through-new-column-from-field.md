---
title: "route PG columns() through newColumnFromField as Rails does"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6097
claim: "2026-08-04T22:11:04Z"
assignee: "port-delegation-record-operators"
blocked-by: null
closed-reason: null
---

## Context

Deferred by #5409 (RFC 0072
`converge-pg-remove-index-and-new-column-from-field-call-sets`). Rails'
`SchemaStatements#columns`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:107`)
is `definitions.map { |field| new_column_from_field(table_name, field, definitions) }`.

trails keeps two parallel implementations:

- `PostgreSQLAdapter#newColumnFromField`
  (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`), now
  a faithful port of Rails' body but with NO runtime caller.
- `PostgreSQLSchemaStatements#columns`
  (`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`,
  ~line 715), which builds the `Column` inline.

Two things block the delegation:

1. `columns()` batch-preloads the row OIDs and resolves types via
   `lookupCastTypeFromColumn`; `newColumnFromField` calls `fetchTypeMetadata`,
   which routes through `getOidType` and would issue a per-column `pg_type`
   query (the reflection-recursion hazard).
2. `columns()` sets `primaryKey: r.is_primary`, sourced from an
   `indisprimary` column trails' `column_definitions` selects and Rails' does
   not. The schema dumper (`schema-dumper.ts:839`) depends on it, so it cannot
   simply be dropped.

The serial match is already shared (one `SERIAL_SEQUENCE_RE` constant plus
`serialFromDefaultFunction`), but the default/metadata/Column construction is
still duplicated.

## Acceptance criteria

- `columns()` routes each row through `newColumnFromField`, or the duplication
  is otherwise eliminated with the two blockers resolved (batch OID preload
  preserved, `primaryKey` still populated for the dumper).
- No per-column `pg_type` query is introduced — assert the query count for a
  `columns()` call.
- `serialFromDefaultFunction` is retired if the delegation makes it dead.
- PG adapter + schema-dumper suites pass under PostgreSQL.
