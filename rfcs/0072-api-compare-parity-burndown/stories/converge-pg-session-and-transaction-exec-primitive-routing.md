---
title: "converge-pg-session-and-transaction-exec-primitive-routing"
status: done
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5410
claim: "2026-07-27T14:37:10Z"
assignee: "converge-pg-session-and-transaction-exec-primitive-routing"
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
  `primary_keys`, `schema_names`, `extension_available?`, `extension_enabled?`,
  `foreign_tables`, `get_advisory_lock`, `release_advisory_lock`. These issue
  `this.pg.schemaQuery(...)` and index the row map by hand instead of routing
  through the ported `queryValue` / `queryValues`.
  The pk-sequence half of this list (`reset_pk_sequence!` / `set_pk_sequence!`
  dropping `query_value` / `quote` / `warn`) was **already shipped by #5389**
  (`converge-pg-sequence-and-schema-qualified-name-helper-call-sets`) — those
  entries are gone from the baseline. Do not re-derive them.

## Acceptance criteria

- Route the DDL/session writes through the ported `execute` / `internalExecute`
  primitives and the reads through `queryValue` / `queryValues`.
- Every listed entry either drops out of
  `call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
  or gets a specific `reason` naming the equivalent path.
- `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/`.

Note: `schema-query-converge-to-internal-exec-query` (RFC 0076) is BLOCKED on
`pg-cast-result-oid-lookup-reentrancy-guard`; this story targets the
`queryValue`/`execute` layer above `schemaQuery`, not `schemaQuery` itself.
