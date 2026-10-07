---
title: "activerecord: expo-sqlite statement columns() answers the prepared column names"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8646, which made the expo-sqlite driver's `reader` come from the prepared
statement's column count (`getColumnNamesAsync()`), as Rails' `stmt.column_count.zero?` does
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:86`).

Two loose ends remain in `packages/activerecord/src/sqlite/expo-sqlite.ts`:

- `ExpoSqliteStatement#columns()` still returns `[]`. Rails builds the result from the statement's
  own column list, `ActiveRecord::Result.new(stmt.columns, stmt.to_a)`
  (`sqlite3/database_statements.rb:90,104`), and the node:sqlite driver's `columns()`
  (`sqlite/node-sqlite.ts:92`) answers the real names. `prepare` already reads the names from
  `getColumnNamesAsync()` and discards all but their count, so a zero-row SELECT on expo yields a
  Result with no columns where Rails' carries them.
- `ExpoSqliteConnection#prepare`'s failure path awaits `stmt.finalizeAsync()` before re-raising. If
  the finalize itself rejects, it masks the original error.

## Acceptance criteria

- [ ] `ExpoSqliteStatement` keeps the column names `prepare` read, and `columns()` answers them
      (name populated; the fields expo cannot report stay null), so a zero-row read returns a Result
      whose `columns` match `stmt.columns` in Rails.
- [ ] A rejecting `finalizeAsync()` in `prepare`'s failure path does not replace the original error.
- [ ] `packages/activerecord/src/sqlite/expo-sqlite.trails.test.ts` covers both.
