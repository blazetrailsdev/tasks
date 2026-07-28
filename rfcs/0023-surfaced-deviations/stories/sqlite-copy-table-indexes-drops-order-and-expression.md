---
title: "copyTableIndexes drops index order and mishandles expression indexes"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `connection-adapters/sqlite3-copy-table.test.ts` onto the
ambient connection (#5500, RFC 0029). Comparing
`AbstractSQLite3Adapter.copyTableIndexes`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2778`) against
Rails' `copy_table_indexes`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:651`)
turns up two divergences. Both silently degrade indexes whenever a table is
rebuilt (`alterTable` / `copyTable` / `moveTable`).

1. **Index column order is dropped.** Rails passes it through:

   ```ruby
   options[:order] = index.orders if index.orders   # sqlite3_adapter.rb:673
   ```

   trails builds the `CREATE INDEX` string by hand and emits only `UNIQUE` and
   `WHERE` — no `order`. A `DESC` index therefore silently becomes `ASC` after
   any `removeColumn` / `changeColumn` on its table.

2. **Expression indexes are mishandled.** Rails guards the column rewrite on
   `columns.is_a?(Array)` (`sqlite3_adapter.rb:661`) precisely because an
   expression index reports `columns` as a String, which is then passed through
   untouched. trails assumes `string[]` unconditionally and runs
   `.map(...).filter(...)` over it, so an expression index is either mangled or
   dropped by the `if (!cols.length) continue` arm.

Related but distinct: `0023-surfaced-deviations/sqlite-alter-table-index-replay-swallows-errors`
covers the _replay_ loop at the tail of `alterTable`. This story is about
`copyTableIndexes` itself.

Also note Rails recreates via `add_index(to, columns, internal: true, **options)`
rather than raw DDL; converging on `add_index` would fix both gaps at once and
pick up name-length validation for free.

## Acceptance criteria

- [ ] `copyTableIndexes` preserves index column order (`orders`) across a table
      rebuild.
- [ ] Expression indexes (non-Array `columns`) survive a rebuild, matching
      Rails' `columns.is_a?(Array)` guard.
- [ ] Prefer routing through `addIndex` (Rails `add_index ... internal: true`)
      over hand-built `CREATE INDEX` DDL, if that does not regress the existing
      rebuild tests.
- [ ] Regression tests fail on baseline (a `DESC` index and an expression index,
      each surviving a `removeColumn`-driven rebuild).
