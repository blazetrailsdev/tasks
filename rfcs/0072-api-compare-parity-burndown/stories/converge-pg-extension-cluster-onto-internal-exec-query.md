---
title: "Route extensions / enable_extension / disable_extension through internal_exec_query"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping #5410 (`converge-pg-session-and-transaction-exec-primitive-routing`,
RFC 0072). That PR converged `extension_available?` / `extension_enabled?` onto
`query_value`, but deliberately stopped at the 500-LOC ceiling and left the
_rest_ of the PG extension cluster on bespoke paths. Still baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
under the generic RFC 0047 seed reason:

- `extensions` dropping `internal_exec_query`, `cast_values`, `compact`
- `enable_extension` dropping `internal_exec_query`, `values_at`
- `disable_extension` dropping `internal_exec_query`, `values_at`

Rails (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:473-520`):

```ruby
def enable_extension(name, **)
  schema, name = name.to_s.split(".").values_at(-2, -1)
  sql = +"CREATE EXTENSION IF NOT EXISTS \"#{name}\""
  sql << " SCHEMA #{schema}" if schema
  internal_exec_query(sql).tap { reload_type_map }
end

def extensions
  query = <<~SQL
    SELECT pg_extension.extname, n.nspname AS schema
    FROM pg_extension
    JOIN pg_namespace n ON pg_extension.extnamespace = n.oid
  SQL
  internal_exec_query(query, "SCHEMA").cast_values.map { ... }.compact
end
```

trails (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`,
`enableExtension` / `disableExtension` / `extensions`) reimplements the
schema-splitting by hand and issues the statements through `this.exec(...)` /
`schemaQuery(...)` rather than `internal_exec_query`. The `values_at(-2, -1)`
idiom in particular is open-coded as index arithmetic on a `split(".")` array
and should be checked against the Ruby semantics for a bare (unqualified) name.

Note the interaction with RFC 0076 `schema-query-converge-to-internal-exec-query`,
which is BLOCKED on `pg-cast-result-oid-lookup-reentrancy-guard`: this story
targets the `internal_exec_query` layer directly at these three call sites, not
`schemaQuery` itself, so it is not blocked by that — but confirm before starting.

## Acceptance criteria

- `extensions`, `enable_extension` and `disable_extension` route through the
  ported `internalExecQuery` primitive and reuse the ported `castValues`.
- The six listed entries drop out of the wide baseline, or get a specific
  `reason` naming the equivalent path (not the generic RFC 0047 seed text).
- `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/extension_migration_test.rb`.
