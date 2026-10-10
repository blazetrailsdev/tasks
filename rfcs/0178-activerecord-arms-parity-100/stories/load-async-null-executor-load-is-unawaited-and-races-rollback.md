---
title: "load-async-null-executor-load-is-unawaited-and-races-rollback"
status: ready
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Relation#load_async`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1138-1155`) opens with
`return load if !c.async_enabled?`. `load` runs the query in line, so by the time `load_async`
returns the rows are read, and a `raise ActiveRecord::Rollback` on the next line cannot precede the
query.

trails' `loadAsync` (`packages/activerecord/src/relation.ts`, the `!c.asyncEnabled()` arm) cannot
await, so it starts `void this.load()` as a floating promise, sets `_loaded = true` and returns. The
query goes out some microtasks later. Inside a transaction whose block then raises `Rollback`, the
ROLLBACK can reach the connection first and the relation reads post-rollback rows.

`LoadAsyncNullExecutorTest#test_load_async_from_transaction`
(`vendor/rails/v8.0.2/activerecord/test/cases/relation/load_async_test.rb:324-336`) covers exactly
this. Until trails#8721 it passed by timing: `DatabaseStatements#transaction` wrapped the block in a
local `fn` that added a few microtasks before the rejection reached the rollback. trails#8721 gave
`transaction` Rails' body (`abstract/database_statements.rb:352-363`), the test went red on SQLite,
MariaDB and PostgreSQL, and the port now carries an `await posts;` inside the block that the Rails
test does not have (`packages/activerecord/src/relation/load-async.test.ts`,
`LoadAsyncNullExecutorTest`). Measured on SQLite, the load is two microtasks short of beating the
rollback.

The async-executor arm is not affected: `execMainQuery(!c.currentTransaction().joinable)` hands the
query to the connection before `loadAsync` returns.

## Acceptance criteria

- [ ] A null-executor `loadAsync` inside a transaction has its query ordered ahead of that
      transaction's ROLLBACK / COMMIT without the caller awaiting the relation, on SQLite, PostgreSQL
      and MariaDB, by construction and not by microtask count.
- [ ] The `await posts;` line is removed from `LoadAsyncNullExecutorTest` "load async from
      transaction", so the body matches `load_async_test.rb:324-336`, and the test passes on all
      three adapter lanes.
- [ ] The `if (inMemoryDb()) await posts;` line is removed from `LoadAsyncTest` "load async from
      transaction" in the same file, so the body matches `load_async_test.rb:65-79`. It was added by
      trails#8725: with `ARCONN=sqlite3_mem` `asyncEnabled()` is false, so that test reaches the
      null-executor arm too, and it runs only on the `Active Record SQLite :memory: Tests` lane
      (push to main, or a PR labelled `run-sqlite-mem`). Verify on that lane.
- [ ] No per-relation parking or drain registry on the transaction.
