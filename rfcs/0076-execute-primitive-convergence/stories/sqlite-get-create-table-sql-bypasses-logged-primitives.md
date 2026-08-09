---
title: "Route sqlite3 _getCreateTableSql callers through the logged query primitives"
status: done
updated: 2026-08-09
rfc: "0076-execute-primitive-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6295
claim: "2026-08-09T19:39:19Z"
assignee: "order-column-fallback-quotes-column-not-table-name"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter#_getCreateTableSql`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, ~line 1962)
reads the CREATE TABLE SQL by going straight to the driver:

```ts
await this.ensureConnected();
const stmt = await this.driver.prepare(sql);
const row = (await stmt.get()) as { sql: string } | undefined;
```

That bypasses `internalExecQuery` / `queryValue` entirely, so the probe is never
instrumented as a `sql.active_record` query, never carries the `"SCHEMA"` name,
and is invisible to `assertQueries` / the LogSubscriber filtering. It also
re-implements the `sqlite_master` / `sqlite_temp_master` UNION with its own
schema-qualifier splitting, which Rails does not do.

PR #5934 converged `checkConstraints` off this helper and onto
`queryValue(<UNION>, "SCHEMA")` per `sqlite3/schema_statements.rb:91-100`. The
remaining callers are the foreign-key reflection arms (`foreignKeys`, the
DEFERRABLE scan around line 1851), which Rails implements via
`table_structure_sql` / `internal_exec_query` in
`sqlite3_adapter.rb#foreign_keys`.

Related surviving wide-call-set entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/sqlite3-adapter.json`:
`foreign_keys` drops `internal_exec_query`, `quote`, `select`,
`table_structure_sql`, `extract_foreign_key_action`. Note the sibling story
`converge-sqlite3-adapter-wide-call-set` owns the FK/check-constraint arms —
coordinate so the two do not overlap.

## Acceptance criteria

- The remaining `_getCreateTableSql` callers route through the logged primitives
  (`queryValue` / `internalExecQuery(..., "SCHEMA")`), and the helper is deleted
  once it has no callers.
- The bespoke schema-qualifier splitting either matches a Rails behavior or is
  justified at the call site.
- The `foreign_keys` wide-call-set entries either clear or carry specific
  per-entry reasons.
- Green on the sqlite3 and sqlite3_mem lanes.
