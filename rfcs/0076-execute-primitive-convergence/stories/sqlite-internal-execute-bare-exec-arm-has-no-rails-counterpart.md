---
title: "sqlite3: retire internalExecute's bare driver.exec arm onto Rails' batch seam"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6313
claim: "2026-08-10T00:10:55Z"
assignee: "port-test-date-arith-operators"
blocked-by: null
closed-reason: null
---

## Context

Rails' SQLite `perform_query` has no unprepared non-statement arm — every
non-batch call prepares, binds `type_casted_binds`, and steps:

```ruby
def perform_query(raw_connection, sql, binds, type_casted_binds, prepare:, notification_payload:, batch: false)
  if batch
    raw_connection.execute_batch2(sql)
  elsif prepare
    stmt = @statements[sql] ||= raw_connection.prepare(sql)
    ...
  else
    # Don't cache statements if they are not prepared.
    stmt = raw_connection.prepare(sql)
    ...
  end
```

(`activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:78-108`)

PR #6295 threaded `binds` and `prepare` through
`SQLite3Adapter#internalExecute` and routed both onto `_cachedStatement` /
`_freshStatement`, but left a third arm with no Rails counterpart:

```ts
if (prepare || binds.length > 0) { ...statement path... }
await this.driver.exec(sql);
```

(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`)

The bare `exec` arm survives because better-sqlite3's `prepare` accepts only a
single statement, while the transaction-control callers push multi-statement SQL
through this method (`BEGIN ... ; PRAGMA read_uncommitted=ON`, savepoint pairs).
Rails' `execute_batch2` is the closest counterpart and is reached only via
`batch: true`, which trails does not thread here.

The arm is reachable only with no binds, so it is not a correctness bug today —
but it is an execution path Rails does not have, in the one method this RFC
exists to converge.

## Converged shape

Thread Rails' `batch:` keyword through `internal_execute` / `raw_execute` to
`perform_query` and route the multi-statement transaction-control callers
through the batch arm explicitly, so the non-batch path always prepares as Rails
does and the bare `driver.exec` fallback disappears.

## Acceptance criteria

- [ ] `SQLite3Adapter#internalExecute` has no arm without a Rails counterpart:
      batch, prepared, and unprepared-prepare, matching
      sqlite3/database_statements.rb:78-108.
- [ ] Multi-statement transaction control reaches the driver through the batch
      seam rather than an untracked `driver.exec` call.
- [ ] The `prepare`/`binds` tests added by #6295 in
      sqlite3-adapter-perform-query.trails.test.ts still pass, plus coverage for
      the batch arm.
- [ ] Green on the sqlite3 and sqlite3_mem lanes.
