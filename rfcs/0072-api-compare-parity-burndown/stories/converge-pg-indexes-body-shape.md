---
title: "Converge PostgreSQL indexes() onto Rails' indkey/INCLUDE-rejection shape"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 5895
claim: "2026-08-02T16:59:58Z"
assignee: "converge-pg-indexes-body-shape"
blocked-by: null
closed-reason: null
---

## Context

PR #5384 converged the PG introspection call set onto Rails' exec primitives, but
deliberately left `PostgreSQLSchemaStatements#indexes`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:106`)
alone. It is the one method in that cluster needing a body reshape rather than a
primitive swap, and it still carries six wide-ratchet entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
(`query`, `quoted_scope`, `column_names_from_column_numbers`,
`unquote_identifier`, `compact`, `presence`), each with a per-entry reason
naming its current SQL-side equivalent.

Rails anchor:
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:86-152`.

Two structural divergences:

1. **Column names are computed in SQL.** trails builds them inside the query via
   `ARRAY(SELECT pg_get_indexdef(ix.indexrelid, k + 1, true) FROM
generate_subscripts(ix.indkey, 1) AS k WHERE k < ix.indnkeyatts)`. Rails
   selects raw `d.indkey` and resolves names in Ruby through
   `column_names_from_column_numbers(oid, indkey)` (schema_statements.rb:120).
   Because trails filters to `k < ix.indnkeyatts` in SQL, the whole
   INCLUDE-column rejection branch (`columns.reject! { |c|
include_columns.include?(c) }`, :122-123) has no counterpart.

2. **Scope is carried by binds, not `quoted_scope`.** trails resolves the table
   with `parseSchemaQualifiedName` plus `$1`/`$2` binds and a `t.oid =
to_regclass($1)` fast path for the unqualified case; Rails interpolates
   `quoted_scope`'s pre-quoted literals. Rails' positional `query` primitive has
   no bind-carrying form, which is why PR #5384 could not simply swap it.

The bind fast path is a real behavioural difference, not just style: it changes
which index rows match for a schema-qualified vs bare table name. Any convergence
has to decide whether to keep it.

## Acceptance criteria

- `indexes` resolves column names the Rails way (raw `indkey` ->
  `columnNamesFromColumnNumbers`) with the INCLUDE-column rejection branch
  ported, or each surviving wide entry records why the SQL form is equivalent.
- The `quoted_scope` vs bind-carrying question is settled explicitly — either
  converged onto `quotedScope` interpolation, or the deviation is justified at
  the call site (not only in the PR body).
- PG index tests named verbatim after Rails' (`test/cases/adapters/postgresql/`),
  covering an INCLUDE (covering) index and an expression index.
- `pnpm parity:api:calls` passes with a strictly smaller baseline.
