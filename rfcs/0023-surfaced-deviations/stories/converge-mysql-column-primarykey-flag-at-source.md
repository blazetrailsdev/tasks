---
title: "Converge MySQL Column.primaryKey at the columns() source (promoted-unique, no query)"
status: ready
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to PR #4594, which converged the _observable_ MySQL promoted-unique
`Column.primaryKey` deviation at the schema-cache layer (`schema-cache.ts`
`reconcilePrimaryKeyFlags`, called from `setColumns` / `setPrimaryKeys` /
`deriveColumnsHash`). That correction is query-free and clear-only, driven by the
authoritative `_primaryKeys` cache.

The underlying _source_ deviation is still live: `mysql/schema-statements.ts:677`
`columns()` still sets `primaryKey: colKey === "PRI"`. MySQL/MariaDB report
`column_key = 'PRI'` for a UNIQUE-NOT-NULL index when a table has no PRIMARY KEY
(the "promoted unique" case), so a **direct** `adapter.columns(table)` caller that
bypasses the schema cache still receives the bogus per-column flag. Rails'
`MySQL::Column` carries **no** per-column primary flag at all
(`abstract_mysql_adapter.rb`) — it resolves PK solely via `@connection.primary_key`.

Currently no observable bug: `introspectPrimaryKey` uses the authoritative
`adapter.primaryKey()` for MySQL (column-flag fallback never fires), and every
in-cache consumer is reconciled. But it remains a latent fidelity gap for any new
direct `columns()` consumer.

## Why not trivially fixed at source (from PR #4379 / #4594)

- A separate PK query inside `columns()` trips `QueryCacheTest > query cached even
when types are reset` (it counts introspection queries).
- Folding a JOIN (key_column_usage / statistics) into the `columns()` SELECT
  disrupts MariaDB's single-table pruning of `information_schema.columns`, timing
  out the full-DB `SchemaDumperTest` (>5s). A correlated subquery is worse.

## Acceptance criteria

- [ ] `mysql/schema-statements.ts` `columns()` no longer flags a promoted-unique
      column as primary — matching Rails' MySQL::Column (no per-column primary
      flag), WITHOUT a new per-table query on the dump path.
- [ ] No QueryCacheTest regression; no SchemaDumperTest timeout.
- [ ] Direct `adapter.columns()` (bypassing schema cache) returns the correct
      (promoted-unique-excluding) flag.
- [ ] api:compare / test:compare non-negative.
