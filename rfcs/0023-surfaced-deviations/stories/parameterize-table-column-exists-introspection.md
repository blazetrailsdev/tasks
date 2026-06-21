---
title: "tableExists/columnExists interpolate identifiers into SQL (unsafe; Rails parameterizes)"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3782
claim: "2026-06-21T12:14:43Z"
assignee: "parameterize-table-column-exists-introspection"
blocked-by: null
---

## Context

Surfaced in review of `pg-indexes-rails-fidelity` (#3340). The schema
introspection helpers `tableExists` (`abstract/schema-statements.ts:480`) and
`columnExists` (`:502`) build their SQL by **interpolating the table/column name
directly** into the query string for all three adapters, with no escaping or
parameterization, e.g.:

```sql
SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
  AND table_name = '${tableName}' AND column_name = '${columnName}' LIMIT 1
```

In #3340 this caused a CI failure: passing an expression `:where` value
(`state = 'active'`) into `columnExists` produced
`column_name = 'state = 'active''` — a SQL syntax error. That PR worked around it
with a `/^\w+$/` bare-identifier guard at the call site, but the underlying
helpers remain unsafe for any caller passing a value containing a quote.

Rails' `column_exists?` / `data_source_exists?`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`)
resolve through the schema cache and parameterized/Arel queries, returning
`false` safely for arbitrary input rather than breaking the SQL. The TS port
should converge: parameterize the bind values (or validate identifiers) so the
helpers are safe regardless of input.

Secondary deviation to consider while here: the PG branches hardcode
`table_schema = 'public'` instead of honoring the current `search_path`, unlike
Rails which scopes to the active schema.

## Acceptance criteria

- [x] `tableExists` and `columnExists` no longer interpolate raw identifier
      values into SQL — use bind parameters (or strict identifier validation) so
      a value containing quotes/operators returns `false` instead of erroring.
- [x] The `/^\w+$/` guard added in #3340 (`postgresql-adapter.ts` addIndex
      where-clause) can be removed or simplified once the helper is safe;
      confirm the #3340 where-quoting tests still pass.
- [x] (If in scope) PG branches scope to the active search_path rather than
      hardcoded `'public'`, matching Rails.
- [x] api:compare / test:compare delta non-negative.
