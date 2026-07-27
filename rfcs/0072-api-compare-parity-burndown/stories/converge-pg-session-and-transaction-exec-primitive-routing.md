---
title: "converge-pg-session-and-transaction-exec-primitive-routing"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up half of `converge-pg-ddl-exec-primitive-and-quoting-routing` (RFC
0072), which shipped the alter-table / quoting half and stopped at the 500-LOC
ceiling. The remaining baselined entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
are the **session / transaction / read-side** ones, anchored in
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`
and `.../postgresql/schema_statements.rb`.

Trails bodies live in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`
(the `this.pg.exec(...)` sites at `createSchema` / `dropSchema` /
`createDatabase` / `dropDatabase` / `clientMinMessages` / `schemaSearchPath`)
and `postgresql-adapter.ts` (transaction statements).

Remaining entries:

- DDL statements dropping `execute`: `create_database`, `drop_database`,
  `create_schema`, `drop_schema`, `rename_table`. These call the trails-private
  `this.pg.exec` rather than the public `execute` primitive; the alter-table
  half already converged the constraint/index sites the same way.
- Session writers dropping `internal_execute`: `client_min_messages=`,
  `schema_search_path=`, `exec_restart_db_transaction`,
  `exec_rollback_db_transaction`.
- Read-side session accessors dropping `query_value` / `query_values`:
  `encoding`, `collation`, `ctype`, `current_database`, `current_schema`,
  `schema_search_path`, `table_comment`, `serial_sequence`, `schema_exists?`,
  `primary_keys`, `reset_pk_sequence!`, `set_pk_sequence!`. These issue
  `this.pg.schemaQuery(...)` and index the row map by hand instead of routing
  through the ported `queryValue` / `queryValues`.
- `reset_pk_sequence!` / `set_pk_sequence!` also drop `quote` and `warn` —
  Rails quotes the already-quoted sequence name for the `::regclass` cast and
  logs `"#{table} has primary key #{pk} with no default sequence."` through
  `@logger.warn`; trails binds the sequence and stays silent.

## Acceptance criteria

- Route the DDL/session writes through the ported `execute` / `internalExecute`
  primitives and the reads through `queryValue` / `queryValues`.
- Restore the `@logger.warn` arms in `set_pk_sequence!` / `reset_pk_sequence!`.
- Every listed entry either drops out of
  `call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
  or gets a specific `reason` naming the equivalent path.
- `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/`.

Note: `schema-query-converge-to-internal-exec-query` (RFC 0076) is BLOCKED on
`pg-cast-result-oid-lookup-reentrancy-guard`; this story targets the
`queryValue`/`execute` layer above `schemaQuery`, not `schemaQuery` itself.
