---
title: "SQLite driver shim raises on unbound placeholders where the Ruby gem binds NULL"
status: claimed
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-05T23:56:22Z"
assignee: "converge-pg-native-types-and-instance-type-map-onto-adapter"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `sqlite3-explain-forwards-binds-rails-passes-empty` on PR
PR #7287, which had to be blocked on this.

Ruby's sqlite3 gem binds a parameter that was never supplied as `NULL`, so a
prepared statement carrying `?` placeholders runs with no values at all. Rails
depends on that: `SQLite3Adapter#explain`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:18-21`)
is

```ruby
sql    = "EXPLAIN QUERY PLAN " + to_sql(arel, binds)
result = internal_exec_query(sql, "EXPLAIN", [])
```

and `to_sql` does **not** strip placeholders when `arel_or_sql_string` is a
String — it returns the string unchanged
(`abstract/database_statements.rb:47-49`). So Rails hands SQLite a statement
whose `?`s are simply left unbound.

trails' driver shim does not have that semantic. Verified with a probe on
`BetterSQLite3Adapter`:

```text
internalExecQuery("EXPLAIN QUERY PLAN SELECT * FROM t WHERE id = ?", "EXPLAIN", [])
  -> RangeError: Too few parameter values were provided
     at BetterSqlite3Statement.all (packages/activerecord/src/sqlite/better-sqlite3.ts:37)
```

Because of that, `AbstractSQLite3Adapter#explain`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) forwards
`binds` where Rails passes `[]`, and cannot converge until the driver layer
answers the way the gem does.

## Converged shape

The trails sqlite driver shim (`packages/activerecord/src/sqlite/better-sqlite3.ts`,
and the `SqliteStatement` contract the other drivers implement) binds a
placeholder with no supplied value as `NULL`, matching the Ruby sqlite3 gem,
rather than raising. Once that holds, `explain` becomes Rails' two lines
verbatim and `sqlite3-explain-forwards-binds-rails-passes-empty` unblocks.

Note the alternative — rendering the binds into the statement before
EXPLAIN'ing it — is NOT the converged shape: it changes the statement SQLite
plans (literals instead of parameters), which can change the plan the test
asserts.

## Acceptance criteria

- [ ] A statement prepared with N placeholders and executed with fewer values
      binds the missing ones as `NULL` instead of raising, on every driver
      behind the `SqliteStatement` contract.
- [ ] A test covers the zero-values case directly against the shim.
- [ ] `sqlite3-explain-forwards-binds-rails-passes-empty` is unblocked, and its
      body can then be Rails' two lines verbatim.
- [ ] SQLite lane green.
