---
title: "PG/abstract executeBatch's transformer-suppression flag spans the await"
status: draft
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`executeBatch` suppresses the `queryTransformers` pass by setting
`host._inQueryTransformers = true` and relying on `preprocessQuery`
(`connection-adapters/abstract/database-statements.ts`) to consume it
**synchronously, before any await**. That consume-before-await is the entire
safety argument: the flag is adapter-instance state, so if nothing consumes it,
it stays set across the `await` and the next query to reach `preprocessQuery`
silently skips its own transformer pass and loses its QueryLogs comment.

PR #6313 proved the shape is live, on sqlite3. Routing sqlite3's `executeBatch`
onto `rawExecute` — correct, per Rails' `execute_batch`
(`activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:126-129`)
— meant `preprocessQuery` no longer ran for batches, because `preprocess_query`
is `internal_execute`'s step
(`abstract/database_statements.rb:589-591`), not `raw_execute`'s. The flag went
unconsumed and a concurrent `execute` interleaved with the in-flight batch lost
its comment. Caught only by
`packages/activerecord/src/connection-adapters/sqlite3-adapter.query-transformers.test.ts`
"does not let a concurrent batch suppress a normal query's comment".

Two copies of the flag survive, both still routing through
`executeMutation` → `preprocessQuery`, so both are _correct today_ and both are
one reroute away from the same bug:

- `connection-adapters/postgresql/database-statements.ts:155-161` — sets the
  flag once, then `await`s each statement in a loop, so the window spans every
  statement of the batch.
- `connection-adapters/abstract/database-statements.ts` (`executeBatch`) — same
  shape, per statement.

## Converged shape

Rails has no suppression flag at all. Batch statements carry no QueryLogs
comment purely because `execute_batch` → `raw_execute` never reaches
`preprocess_query`, which is where `ActiveRecord.query_transformers` runs
(`abstract/database_statements.rb:589-591`). Deleting the flag and letting the
routing do the work is the convergence — the same deletion PR #6313 made on
sqlite3.

This overlaps `converge-execute-batch-through-raw-execute` (blocked): if that
story lands first it deletes the flag as a side effect and this one closes with
it. Filed separately because that story is blocked behind
`wire-perform-query-on-sqlite3-mysql2-prototypes`, and the flag is a live
concurrency defect in the meantime.

## Acceptance criteria

- [ ] No `_inQueryTransformers` write survives outside `preprocessQuery`, on any
      adapter — batch statements stay uncommented because they never reach the
      transformers, not because a flag suppressed them.
- [ ] A regression test in the PG lane mirroring the sqlite3 one: a query issued
      concurrently with an in-flight `executeBatch` keeps its QueryLogs comment.
- [ ] `pnpm parity:api:calls` non-negative; no new baseline row.
