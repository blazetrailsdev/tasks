---
title: "columnMethodNames() parity: mirror MySQL/SQLite define_column_methods exactly (not nativeDatabaseTypes)"
status: done
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3565
claim: "2026-06-17T18:54:44Z"
assignee: "adapter-columnmethodnames-mysql-sqlite-parity"
blocked-by: null
---

## Context

PR #3484 added `AbstractAdapter#columnMethodNames()` (default: `Object.keys(nativeDatabaseTypes())`)
and a PostgreSQLAdapter override appending `serial`/`bigserial`, consumed by the
`change_table` recorder proxy (`withAdapterColumnMethods` in
`packages/activerecord/src/migration/command-recorder.ts`).

This converges PG to Rails' explicit `define_column_methods` list
(`postgresql/schema_definitions.rb:177-180`). But the abstract default is still
the native-types approximation, and MySQL/SQLite adapters do NOT override
`columnMethodNames()`. Rails' MySQL `ColumnMethods`
(`mysql/schema_definitions.rb`) calls its own `define_column_methods`
(e.g. `:blob`, `:tinyblob`, `:mediumblob`, `:longblob`, `:tinytext`,
`:mediumtext`, `:longtext`, `:unsigned_integer`, ...) which may diverge from
that adapter's `nativeDatabaseTypes` keys.

## Acceptance criteria

- [x] Diff each adapter's `nativeDatabaseTypes` keys against its Rails
      `define_column_methods` list (MySQL, SQLite, Abstract).
- [x] Where they diverge, override `columnMethodNames()` on that adapter to
      mirror the explicit Rails list exactly (as PG now does), so the
      `change_table` proxy surfaces the same `t.<type>` shorthands as Rails.
- [x] Add round-trip / recording coverage for any newly-surfaced shorthands.
