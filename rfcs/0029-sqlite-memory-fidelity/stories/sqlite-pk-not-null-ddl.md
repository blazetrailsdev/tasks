---
title: "sqlite-pk-not-null-ddl"
status: ready
updated: 2026-06-26
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 95
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`defaults.test.ts` `DefaultTest#nil_defaults_for_not_null_columns` (Rails
`defaults_test.rb`) asserts the primary key `id` column is `NOT NULL` on every
adapter. trails' SQLite `create_table` emits `"id" integer PRIMARY KEY` without
the `NOT NULL` clause Rails adds (`"id" integer PRIMARY KEY AUTOINCREMENT NOT
NULL`), so PRAGMA `table_info` reports `notnull=0` and `Column#null` reflects
`true` on the SQLite lane only (PG/MySQL bigint PKs already reflect `NOT NULL`).

- trails: `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`
  (`primary_key: { name: "integer" }` ~line 1249; column def assembly ~line
  2224 only appends `NOT NULL` when `col.notnull`).
- trails reflection: `connection-adapters/sqlite3/schema-statements.ts`
  `newColumnFromField` sets `null = Number(field["notnull"]) === 0`.
- The test currently skips the `id` assertion on the SQLite lane with a
  `TRACKED DEVIATION (convergence story sqlite-pk-not-null-ddl)` comment.

## Acceptance criteria

- [ ] trails' SQLite `create_table` emits the Rails-faithful primary-key
      definition (`integer PRIMARY KEY AUTOINCREMENT NOT NULL`) so PRAGMA
      reports `notnull=1` and `Column#null` is `false` for the implicit `id`.
- [ ] Remove the `adapterType === "sqlite"` skip + TRACKED DEVIATION comment in
      `defaults.test.ts` so `id` is asserted NOT NULL on all adapters.
- [ ] No schema-dump snapshot regressions (verify dumper still round-trips the
      pk definition).
