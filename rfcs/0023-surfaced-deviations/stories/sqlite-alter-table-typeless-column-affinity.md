---
title: "SQLite alterTable rebuild retypes typeless columns, changing affinity"
status: closed
updated: 2026-08-09
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
closed-reason: 'Already done: the `?? "TEXT"` colDefs builder no longer exists — alterTable (sqlite3-adapter.ts:2293) is now Rails'' two-move_table/copy_table rebuild, which re-derives each column through the table definition exactly as copy_table does, so a typeless column round-trips typeless.'
---

## Context

`AbstractSQLite3Adapter.alterTable`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, the
`colDefs` builder) types each rebuilt column as:

```ts
let def = `${quoteColumnName(name)} ${col.type ?? "TEXT"}`;
```

`col.type` comes from `PRAGMA table_info`, which returns an **empty string** for
a column declared with no type. SQLite gives such a column BLOB (none) affinity;
rebuilding it as `TEXT` changes affinity, so numeric values stored through it
come back as text after any `alterTable`-driven rebuild (changeColumn,
removeColumn, addForeignKey, removeForeignKey, check-constraint changes…).

Surfaced in #5478: the same `?? "TEXT"` fallback was present in the new
intermediate-buffer path and was fixed there (a typeless column is now emitted
with no type at all), but the fallback on the **real** rebuilt table was left
alone as pre-existing behavior outside that story's scope.

Rails' `copy_table` re-derives each column through `@definition.column` from
`columns(from)`, so a typeless column round-trips as typeless.

Note `PRAGMA table_info` returns `""`, not NULL, for these — `?? "TEXT"` never
even fires for the typeless case; the empty string falls through and produces a
trailing-space `"col "` definition instead. Both arms want fixing together.

## Acceptance criteria

- [ ] A typeless column survives an `alterTable` rebuild with its declared type
      (i.e. none) intact — `PRAGMA table_info` reports the same `type` before and
      after.
- [ ] Regression test stores a numeric value in a typeless column, triggers a
      rebuild, and asserts the value reads back as a number, not a string.
- [ ] Test fails on baseline (pre-fix).
- [ ] `adapters/sqlite3/**` (incl. `CopyTableTest`), `connection-adapters/sqlite3/**`,
      `migration.test.ts` and `schema-dumper.test.ts` stay green.
