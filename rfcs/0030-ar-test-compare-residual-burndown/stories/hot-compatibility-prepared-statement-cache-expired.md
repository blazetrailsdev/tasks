---
title: "PG prepared-statement-cache-expired cleanup mid-transaction"
status: in-progress
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3737
claim: "2026-06-20T19:01:29Z"
assignee: "hot-compatibility-prepared-statement-cache-expired"
blocked-by: null
---

## Context

`packages/activerecord/src/hot-compatibility.test.ts` has two tests gated
`adapterType !== "postgres"` (Rails `hot_compatibility_test.rb:59`,
`current_adapter?(:PostgreSQLAdapter) && prepared_statements`) but
`ctx.skip()`-pending:

- "cleans up after prepared statement failure in a transaction"
- "cleans up after prepared statement failure in nested transactions"

Requires two pool connections plus detection/recovery of PG
`PreparedStatementCacheExpired` after a DDL change on a second connection
mid-transaction (and across nested savepoints). Rails source lines 59-84 and
86-115. No open tracking story.

## Acceptance criteria

- [ ] trails detects PG prepared-statement-cache-expired mid-transaction and
      retries/cleans up as Rails does, across plain and nested transactions.
- [ ] Drop `ctx.skip()`; both tests run on PG with prepared statements.
- [ ] `test:compare` delta non-negative; test names unchanged.
