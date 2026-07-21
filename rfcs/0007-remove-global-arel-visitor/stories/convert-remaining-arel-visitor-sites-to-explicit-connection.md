---
title: "convert-remaining-arel-visitor-sites-to-explicit-connection"
status: blocked
updated: 2026-07-21
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: 460
priority: null
pr: null
claim: "2026-07-21T18:35:17Z"
assignee: "convert-remaining-arel-visitor-sites-to-explicit-connection"
blocked-by: "Blocked on #5032 (open, unmerged): that PR introduces packages/arel/src/test-helpers/connection.ts, which every site in this story must import. origin/main (613795e5e) has no such file, so this story cannot be done as a standalone PR from main without either duplicating the helper (file overlap with #5032) or stacking on its branch. Unblock when #5032 merges."
closed-reason: null
---

## Context

Follow-up to #5032, which converted `to-sql.test.ts` (219 sites) to name its
connection explicitly via `packages/arel/src/test-helpers/connection.ts`.

Rails builds Arel visitors with a real connection —
`Visitors::ToSql.new Table.engine.lease_connection`
(`arel/nodes/sql_literal_test.rb:10`, `arel/visitors/sqlite_test.rb:9`). Rails has
no connection-less visitor path.

Remaining bare construction sites in `packages/arel` (counts at #5032 merge):

- `visitors/postgres.test.ts` — 61
- `attributes/attribute.test.ts` — 30
- `visitors/mysql.test.ts` — 26
- `select-manager.test.ts` — 18
- `visitors/sqlite.test.ts` — 15
- `visitors/dot.test.ts` — 12
- `predications.test.ts` — 10
- plus ~40 across `nodes/*.test.ts`, `attributes/math.test.ts`,
  `factory-methods.test.ts`, `table.test.ts`, `predications-range.test.ts`,
  `attribute-alignment.test.ts`, `dispatch-contamination.test.ts`

Import `testConnection` / `mysqlTestConnection` / `postgresqlTestConnection` from
`test-helpers/connection.ts` — do NOT reintroduce a bare constructor call.

Split across 2-3 PRs to stay under the LOC ceiling (each converted site is ~2 LOC).
Files are non-overlapping, so the PRs can be opened from main in parallel.

## Acceptance criteria

- [ ] No `new Visitors.ToSql()` / `new Visitors.MySQL()` / `new Visitors.PostgreSQL()` /
      `new Visitors.SQLite()` / `new Visitors.Dot()` without an explicit connection
      anywhere in `packages/arel`.
- [ ] No test names changed (test:compare delta 0).
- [ ] api:compare delta non-negative.
