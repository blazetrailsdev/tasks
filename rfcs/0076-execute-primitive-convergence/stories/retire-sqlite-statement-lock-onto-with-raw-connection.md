---
title: "Retire the sqlite _statementLock queue once execute routes through with_raw_connection"
status: draft
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps:
  - wire-raw-execute-through-log
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

Rails serializes SQLite statements by running `perform_query` inside
`with_raw_connection`'s `@lock.synchronize`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-559`
-> `abstract_adapter.rb`'s `with_raw_connection`), which is what lets
`perform_query` read `raw_connection.changes` /
`raw_connection.last_insert_row_id` post-hoc and attribute them to the
statement it just ran
(`activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:78-113`).

PR #6299 converged `_performQuery` onto that contract — the branch is
`stmt.column_count.zero?` alone and the counts come from the connection — but
trails' sqlite `execute` / `executeMutation` do NOT go through
`withRawConnection`, so there was no lock to inherit. It therefore carries its
own FIFO queue: `acquireStatementLock` and the `_statementLock` tail in
`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`
(the helper, `@internal`, ~20 LOC) plus the `_statementLock` field on
`SQLite3Adapter`. `internalExecQuery` takes it too.

That helper has **no Rails counterpart**. It is extra surface justified only by
the missing routing, and it becomes redundant the moment
`wire-raw-execute-through-log` lands the
`internal_execute -> raw_execute -> log -> with_raw_connection -> perform_query`
chain on this adapter: `withRawConnection` already routes through the
transaction manager's per-connection lock (`abstract-adapter.ts`'s
`withRawConnection` -> `_transactionManager.synchronize`), which is the real
port of Rails' `@lock`.

Sequences AFTER `wire-raw-execute-through-log`; there is nothing to retire onto
until that routing exists.

## Converged shape

Once sqlite `execute` / `executeMutation` / `internalExecQuery` run inside
`withRawConnection`, delete `acquireStatementLock`, the `_statementLock` field
and the three call sites, and let the inherited lock hold the connection across
the statement and its `changes()` / `lastInsertRowId()` readbacks.

One thing to check before deleting, and the reason this is not a mechanical
removal: `_transactionManager.synchronize` is REENTRANT per async chain, so a
`Promise.all` of writes inside one transaction shares a lock owner and
re-enters — which is exactly the interleaving the FIFO queue was introduced to
prevent (PR #4893's `last_insert_rowid()` race). Rails does not have this
problem because one Ruby thread is never inside two `perform_query` calls.
Either establish that the reentrant arm cannot be reached with two statements
in flight, or make the raw-connection lock non-reentrant for the statement
critical section.

## Acceptance criteria

- [ ] `acquireStatementLock` and `SQLite3Adapter#_statementLock` are deleted;
      serialization comes from `withRawConnection`.
- [ ] The two regression tests PR #6299 added still pass, converted to drive
      the adapter rather than the helper directly:
      `serializes statements queued on one connection` and
      `does not let a late statement barge ahead of one already queued`
      (`adapters/sqlite3/sqlite3-adapter-perform-query.trails.test.ts`).
- [ ] Parallel `Promise.all` inserts INSIDE a transaction still return
      distinct, correct ids — the reentrancy case above.
- [ ] `HasManyThroughAssociationsTest` "should respect table alias" stays green.
- [ ] `pnpm parity:api:extra --package activerecord` shows one fewer `@internal`
      no-counterpart helper.

## Update 2026-08-10 (PR #6327)

Two facts for whoever retires this helper.

1. `acquireStatementLock` no longer returns a bare `Promise<() => void>`: an
   uncontended acquisition answers **synchronously** (union return type, and
   `_statementLock` drains back to `null`), because `await` on a settled tail
   still costs a turn and that turn was enough for a pool `disconnect` to close
   the handle between the acquisition and the statement. Whatever replaces the
   helper has to keep that property — `withRawConnection` →
   `_transactionManager.synchronize` must not add a gratuitous yield on the
   transaction-control path.
2. The window is narrowed, not closed:
   `sqlite-disconnect-must-serialize-on-statement-lock` covers the close path
   not taking the lock at all, which is what Rails' `@lock` gets for free.
   Retiring the helper onto `withRawConnection` should subsume that story —
   check it before starting, and close it here if it does.

`performQuery` now also serves `raw_execute` (batch / prepared / unprepared
arms), so the lock covers transaction-control SQL and `execute_batch` too, not
just `execute` / `executeMutation`.
