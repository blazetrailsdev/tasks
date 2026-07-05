---
title: "sqlite3-json-default-serialization"
status: ready
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting `copy_table_test.rb` to
`packages/activerecord/src/adapters/sqlite3/copy-table.test.ts`. The test
`test_copy_table_with_column_with_default` is skipped (BLOCKED tag in that file).

Adding a `json` column with `default: {}` quotes the default via `String({})`
→ `"[object Object]"` instead of serializing the value to JSON `"{}"`. After
`copy_table`, the copied column's introspected `default` is `"[object Object]"`
where Rails reports `"{}"`.

## Acceptance criteria

- Structured defaults (objects/arrays) for json columns serialize through the
  column type before being quoted into the DEFAULT clause for SQLite.
- Un-skip `copy table with column with default` in
  `packages/activerecord/src/adapters/sqlite3/copy-table.test.ts`.
