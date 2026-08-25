---
title: "Burn down require-table-teardown raw-SQL grandfather list to zero (Path D)"
status: done
updated: 2026-06-23
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 3976
claim: "2026-06-23T11:22:44Z"
assignee: "ar-test-reset-raw-sql-teardown-burndown"
blocked-by: null
---

## Context

PR #3965 (story `ar-test-reset-bespoke-table-teardown-ratchet`, RFC 0028 Path D)
extended the `require-table-teardown` ESLint rule to flag raw `CREATE TABLE`
SQL handed to execution sinks that is never torn down. It shipped with **39
files grandfathered** in `eslint/require-table-teardown-raw-sql-exclude.json`
(`rawSql: false`) — each has at least one raw `CREATE TABLE`/`exec` that leaks a
bespoke table onto the shared per-worker DB. These leaked tables are the bulk of
the ~2,600 distinct tables the `dropAllTables` fan-out re-drops every run
(audit: `docs/infrastructure/ar-test-reset-drop-table-churn-audit.md`).

The ratchet only _prevents new_ leaks; it does not fix existing ones. The payoff
— shrinking the distinct-table count Path D fans over — comes from burning the
exclude list to zero by adding real teardown (a matching raw `DROP TABLE` or
`dropTable(...)` per leaked table) to each file, then deleting its exclude entry.

## Acceptance criteria

- For each of the 39 files in
  `eslint/require-table-teardown-raw-sql-exclude.json`, add explicit teardown
  for every raw-created table it leaks and remove its exclude entry.
- Burn the exclude list to zero (or split into per-cluster sub-stories if too
  large for one 500-LOC PR — do NOT exceed the ceiling).
- No test renames; teardown must not change test behavior.
- When the list reaches `[]`, the conditional grandfather block in
  `eslint.config.mjs` becomes inert (the empty-`files` spread guard already
  handles this) — leave the rule wiring in place.
