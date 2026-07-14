---
title: "unify-execute-mutation-into-perform-query"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

trails splits the SQL write/read path into two primitives that Rails does not
have: `execute` (runs `.all()`, returns rows, wired to dirty the query cache via
`dirtiesQueryCacheExceptSchema`) and `executeMutation` (runs `.run()`, returns
affected-row count / lastInsertRowid, enforces the readonly-write guard,
materializes transactions, unwired). **That split is itself the deviation.**

Rails has ONE primitive, `perform_query`, which branches internally on whether
the statement returns rows
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:78-112`):

```ruby
result = if stmt.column_count.zero? # No return
  stmt.step
  ActiveRecord::Result.empty
else
  ActiveRecord::Result.new(stmt.columns, stmt.to_a)
end
@last_affected_rows = raw_connection.changes
```

Affected-rows is sourced from a SEPARATE `raw_connection.changes` read
(`affected_rows(result)` returns `@last_affected_rows`) — not from the statement
result. Each adapter defines its own `perform_query`:

- `abstract/database_statements.rb:561`
- `sqlite3/database_statements.rb:78`
- `postgresql/database_statements.rb:135`
- `mysql2/database_statements.rb:41`

Because of the split, trails' DDL in `abstract/schema-statements.ts` calls
`this.adapter.executeMutation(...)` at ~26 sites (322, 404, 417, 440, 458, 481,
521, 525, 554, 569, 573, 582, 672, 685, 690, 843, 892, 917, 964, 976, 1082,
1800, 1855, 1869, 2105, 2123) plus adapter overrides (e.g.
`sqlite3-adapter.ts:1529/1591/1601/1607/1630`, `mysql2-adapter.ts:1352`),
whereas Rails runs DDL through the public `execute`
(`add_column` is `execute schema_creation.accept(add_column_def)`,
`abstract/schema_statements.rb:636-641`). Consequence: **DDL does not dirty the
query cache on main.**

### Why the naive fix does not work

Simply swapping the DDL sites from `executeMutation` to `execute` breaks every
DDL statement on sqlite. trails' sqlite `execute` (`sqlite3-adapter.ts:449-484`)
calls `stmt.all()`, and better-sqlite3 throws on a non-row-returning statement.
Probed directly against the vendored driver:

```text
stmt.reader = false
.all() THREW -> This statement does not return data. Use run() instead
```

So `add_column` -> `execute` -> `.all()` -> throw. Routing DDL through `execute`
REQUIRES `execute` to first gain Rails' `column_count.zero?` branch.

### Relationship to PR #4858 (open, unmerged)

PR #4858 ("fix(query-cache): DDL via executeMutation dirties the query cache") took
the other route: wire `executeMutation` to dirty, with a `_writeDirtyDepth`
re-entrancy guard so CRUD (`execInsert`/`execUpdate`/`execDelete` ->
`executeMutation`) does not double-clear. That guard is trails-only machinery
with no Rails counterpart, and #4858's own later commits (`4cd25c89b`,
`b214bb2ef`) show it fighting concurrent-write regressions in the guard.

Once the primitives are unified and DDL routes through `execute`, **no guard is
needed at all** — `execute` is already wired via `dirtiesQueryCacheExceptSchema`
on all three adapters (`sqlite3-adapter.ts:3179`, `postgresql-adapter.ts:5231`,
`mysql2-adapter.ts:2179`). This story therefore SUPERSEDES #4858 rather than
following it. The predecessor story
`converge-ddl-through-execute-drop-dirty-guard` was blocked as mis-specified: it
assumed #4858 had merged and framed the work as a mechanical call-site swap.

Related: `converge-execute-batch-through-raw-execute` (RFC 0023) targets the same
primitive layer — sequence these together.

## Acceptance criteria

- [ ] Give each adapter a single Rails-shaped `performQuery` primitive that
      branches on whether the statement returns rows (sqlite: `stmt.reader` /
      `columnCount === 0` -> `.run()` + empty Result; else `.all()`), mirroring
      `perform_query` in each of the three Rails adapter
      `database_statements.rb` files.
- [ ] Source affected-rows from a separate `affectedRows`/`_lastAffectedRows`
      read (Rails `raw_connection.changes`), not from the statement result, so
      the row-count/lastInsertRowid semantics CRUD depends on survive.
- [ ] Preserve the readonly-write guard (`ReadOnlyError`) and
      `materializeTransactions()` on the write path once `executeMutation` is
      folded in.
- [ ] Route DDL in `abstract/schema-statements.ts` (~26 sites) and adapter
      overrides through `execute`, matching Rails' `schema_statements.rb` call
      shape, so DDL dirties the query cache with NO `_writeDirtyDepth` guard.
- [ ] Keep the `times: 1` query-cache expiry tests green (no CRUD double-clear)
      and add/keep a DDL-clears-the-cache assertion.
- [ ] Verify DDL is not cached in the prepared-statement pool across a schema
      change (stale-plan risk when DDL starts flowing through the `execute`
      statement-pool path).

## Notes

Larger than the 500 LOC ceiling — expect to need a waiver or a split into
per-adapter PRs sequenced from main (sqlite3 first, then postgresql, then
mysql2), with the DDL call-site reroute last, once all three primitives branch.
