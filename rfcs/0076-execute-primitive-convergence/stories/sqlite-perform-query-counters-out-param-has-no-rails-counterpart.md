---
title: "Retire performQuery's counters out-parameter by converging the SQLite write path onto affected_rows(internal_execute(...))"
status: draft
updated: 2026-08-14
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Shipped in PR #6539 (story `sqlite3-perform-query-returns-result`) and to be
converged away, not kept.

Rails' SQLite3 `perform_query` stores the count and its callers read it back
through a separate reader:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:108
@last_affected_rows = raw_connection.changes

# :123-125
def affected_rows(result)
  @last_affected_rows
end

# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:165,172
def exec_delete(sql, name = nil, binds = [])
  affected_rows(internal_execute(sql, name, binds))
end
```

That post-hoc read is safe in Ruby only because `with_raw_connection` holds
`@lock` across the whole call
(`abstract/database_statements.rb:552-559`), so no second thread's
`perform_query` can land between the store and the read.

trails' SQLite write path does not go through `exec_delete`/`exec_insert`: it
goes through `SQLite3Adapter#executeMutation`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`), the
trails-only half of the `execute`/`executeMutation` split justified at the
`AbstractAdapter` declaration in `abstract-adapter.ts`. A JS caller resumes a
microtask after `await performQuery(...)`, by which time a concurrent write's
`performQuery` may already have overwritten `_lastAffectedRows` /
`_lastInsertRowid` — the `Promise.all` insert race originally hit in PR #4893.

So #6539 shipped a `counters` out-parameter on `performQuery`'s options
(`connection-adapters/sqlite3/database-statements.ts`), filled in the same
synchronous turn the `_last*` fields are written, and `executeMutation` reads
that instead. It has no Rails counterpart and exists only to serve the split.

## Converged shape

Retire the out-parameter by retiring what needs it: the SQLite write path
becomes Rails' own, `affected_rows(internal_execute(sql, name, binds))`
(`abstract/database_statements.rb:165,172`) with the id coming from the
RETURNING readback via `last_inserted_id(result)` (`:718-720`) — note Rails'
SQLite3 adapter defines no `last_inserted_id` override and never reads
`last_insert_row_id` on the modern path, because `supports_insert_returning?`
routes inserts through RETURNING. With the split gone, `affected_rows(result)`
reading `_lastAffectedRows` is safe for the same reason Rails' is, and
`performQuery`'s options list matches `perform_query`'s kwargs exactly
(`prepare:`, `notification_payload:`, `batch:`).

Related and possibly a prerequisite: `retire-sqlite-statement-lock-onto-with-raw-connection`
(same RFC) — once the lock is `with_raw_connection`'s, the window this
out-parameter closes is the one that story is also reasoning about.

## Acceptance criteria

1. The `counters` option is gone from `performQuery`'s signature, and its
   options object carries exactly Rails' three kwargs.
2. No caller reads `_lastAffectedRows` / `_lastInsertRowid` across an await;
   the SQLite write path reaches its count through `affectedRows(result)` and
   its id through the RETURNING readback, as Rails does.
3. The `Promise.all` concurrent-insert coverage in
   `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter-perform-query.trails.test.ts`
   ("returns distinct insert ids for concurrent inserts", "returns the rowid of
   each of two RETURNING inserts issued together") still passes, and the
   `HasManyThroughAssociationsTest` "should respect table alias" guard cited
   there stays green.
4. `pnpm parity:api:calls` / `parity:api:calls:args` non-negative.
