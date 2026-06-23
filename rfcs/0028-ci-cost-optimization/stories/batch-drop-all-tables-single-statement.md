---
title: "Batch dropAllTables into one multi-table DROP (86k round-trips -> hundreds)"
status: draft
updated: 2026-06-23
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

DDL-timing audit (PR #3904, audit `ddl-timing-profile`) found `DROP TABLE` is the
dominant test-suite DDL cost: **86,816 drops/run on PostgreSQL (76.1s, 63% of DDL
ms) and 85,783 on MariaDB (60.9s, 87%)**. The mechanism: `dropAllPgTables` /
`dropAllMysqlTables` in `packages/activerecord/src/test-helpers/drop-all-tables.ts`
(and the `defineSchema(..., {dropExisting:true})` rebuild path) enumerate every
table and issue **one `DROP TABLE … CASCADE` round-trip per table** in a loop —
~200 round-trips per file that triggers a full reset.

Both PG and MariaDB CI servers already run on tmpfs (PG also `initdb --no-sync`),
so each individual DROP is already as cheap as it gets; the residual cost is
round-trip latency against a DB server shared by 8 contending workers (the audit
measured the server busy with DDL for 26% (PG) / 14% (Maria) of the test window).

This story is the **low-risk first slice** of `ar-test-reset-drop-table-churn`
(the broader "stop dropping on the happy path" redesign): keep dropping, but
collapse the per-table loop into a **single multi-table statement**. PG and MySQL
both support `DROP TABLE a, b, c … CASCADE` / `DROP TABLE IF EXISTS a, b, c` in one
statement. Same logical work, ~86k round-trips → ~hundreds (one per reset).

## Acceptance criteria

- `dropAllPgTables` and `dropAllMysqlTables` (and the sqlite variant where
  applicable) issue a single batched `DROP TABLE` over all enumerated tables
  instead of one statement per table. Preserve the existing CASCADE / FK-disable
  semantics and the per-DROP error-swallowing behavior (fall back to per-table on
  error if needed so teardown noise still can't abort the sequence).
- Re-measure with the `DDL_PROFILE=1` profiler (PR #3904, now dormant/opt-in):
  DROP round-trip count drops sharply; confirm AR job wall-clock does not regress.
- No new shared-DB flakes; canonical schema/fixtures unchanged.
- Note relationship to `ar-test-reset-drop-table-churn`: if that story later
  eliminates the happy-path drops entirely, batching becomes moot — but this is
  shippable now and independently valuable.
