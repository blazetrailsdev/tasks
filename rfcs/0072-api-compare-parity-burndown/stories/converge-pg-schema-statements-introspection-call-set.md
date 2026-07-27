---
title: "converge-pg-schema-statements-introspection-call-set"
status: in-progress
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5384
claim: "2026-07-27T01:02:54Z"
assignee: "converge-pg-schema-statements-introspection-call-set"
blocked-by: null
closed-reason: null
---

## Context

Fallout cluster from the #5334 include-resolution reseed, surviving the
delegation-transparency gate added by
`burn-down-mixin-driven-wide-ratchet-expansion`. These entries are NOT an
attribution artifact: the trails port lives in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`
and genuinely omits calls Rails' body makes.

The pattern is consistent: Rails introspects with a lean SQL query and then does
the shaping in Ruby; trails pushes the shaping INTO the SQL. Anchor bodies in
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`:

- `indexes` (line 86) — drops `column_names_from_column_numbers`, `quoted_scope`,
  `query`, `unquote_identifier`, `presence`, `compact`. trails computes column
  names via `pg_get_indexdef(ix.indexrelid, k + 1, true)` inside the query
  (schema-statements-class.ts `indexes`), so the whole `indkey`/INCLUDE-column
  rejection branch (schema_statements.rb:117-134) has no counterpart.
- `foreign_keys` — drops `internal_exec_query`, `size`.
- `exclusion_constraints` — drops `internal_exec_query`, `split`, `from`, `to`.
- `unique_constraints` — drops `internal_exec_query`, `delete`.
- `check_constraints` — drops `internal_exec_query`.
- `primary_keys` — drops `query_values`, `quote_table_name`.
- `table_partition_definition` — drops `query_value`, `quoted_scope`.
- `column_names_from_column_numbers` — drops `compact`, `query`, `values_at`.
- `inherited_table_names`, `foreign_tables`, `foreign_table_exists?`,
  `schema_names` — drop `query_values` (and `quoted_scope` / `any?`).

Read each Rails body before deciding: some of these are legitimate SQL-side
equivalents that only need the exec primitive converged (`query` /
`query_values` / `internal_exec_query` rather than a bespoke `schemaQuery`),
others are real behaviour gaps (the INCLUDE-column rejection in `indexes`).

## Acceptance criteria

- For each method above, converge the TS body to Rails' shape or record a
  per-entry `reason` in
  `scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
  naming the SQL-side equivalent that satisfies the Ruby call.
- Route introspection through the ported exec primitives (`query`,
  `queryValue`, `queryValues`, `internalExecQuery`) rather than adapter-local
  helpers, where the Rails body uses them.
- `pnpm api:calls:wide` passes with a strictly smaller baseline; no entry is
  merely reworded.
- Tests: PG-adapter schema-statements tests named verbatim after the Rails
  tests in `vendor/rails/activerecord/test/cases/adapters/postgresql/`.
