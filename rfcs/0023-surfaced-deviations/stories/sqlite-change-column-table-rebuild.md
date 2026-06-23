---
title: "SQLite changeColumn table-rebuild path (column-type change)"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: 150
priority: 40
pr: 3944
claim: "2026-06-23T00:59:14Z"
assignee: "sqlite-change-column-table-rebuild"
blocked-by: null
---

## Context

`packages/activerecord/src/query-cache.test.ts` gates
"cache gets cleared after migration" on a runtime guard
(`sqliteChangeColumnBlocked = adapterType === "sqlite"`). On SQLite trails'
`changeColumn` emits a raw `ALTER TABLE … ALTER COLUMN` (SQLITE_ERROR: near
"ALTER": syntax error) instead of the SQLite table-rebuild path
(create temp + copy + drop + rename) Rails uses. Rails runs the test
unconditionally.

Surfaced by RFC 0032 gate-over-gated-burndown; previously an `adapterType`
over-gate, now an incomparable runtime guard pending this convergence.

## Acceptance criteria

- [ ] Implement the SQLite table-rebuild path for `changeColumn` (column-type
      change) matching Rails' SQLite3Adapter.
- [ ] Remove the `sqliteChangeColumnBlocked` guard so the test runs on SQLite.
- [ ] `test:compare --package activerecord --gates` stays at 0 over-gated for
      query-cache.test.ts.
