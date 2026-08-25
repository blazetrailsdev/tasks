---
title: "converge-data-sources-query-values-first-arm"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5807
claim: "2026-08-01T17:57:00Z"
assignee: "converge-data-sources-query-values-first-arm"
blocked-by: null
closed-reason: null
---

## Context

Found during review of PR 5804 (story
`remove-bespoke-adapter-data-sources-overrides`), which deleted the three
bespoke adapter `dataSources` shadows so every adapter reaches the base body.

The base body itself is still a trails invention. Rails
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:33-38`:

```ruby
def data_sources
  query_values(data_source_sql, "SCHEMA")
rescue NotImplementedError
  tables | views
end
```

trails
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1618`
skips the `query_values(data_source_sql, "SCHEMA")` attempt entirely and goes
straight to the `tables | views` rescue arm:

```ts
async dataSources(): Promise<string[]> {
  const t = await this.tables();
  const v = await this.views();
  return [...new Set([...t, ...v])];
}
```

This is observable: adapters that implement `dataSourceSql()` (sqlite3 does —
`sqlite3-adapter.ts` `dataSourceSql`) should be answering from one catalog
query, not two round-trips. The sibling `dataSourceExists` immediately below
already has the correct try / `NotImplementedError` shape, so this method is
the odd one out in its own file.

Also note Rails' rescue arm is `tables | views` — Ruby array union, which
dedupes AND preserves first-seen order. The trails `Set` spread matches that
semantic; keep it for the fallback arm.

## Acceptance criteria

- `dataSources` attempts `this.adapter.dataSourceSql()` via `schemaQuery`
  first, mirroring `dataSourceExists`'s existing shape in the same file.
- On `NotImplementedError` it falls back to `tables | views` (dedupe +
  first-seen order preserved).
- Any other error propagates (do not swallow).
- Adapters that do not implement `dataSourceSql` keep their current behaviour
  through the fallback arm.
- Schema-cache and schema-statements suites pass on sqlite, pg and mysql.
