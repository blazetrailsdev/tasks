---
title: "SQLiteDatabaseTasks#purge swallows every error in two trails-only helpers instead of rescuing NoDatabaseError"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6264
claim: "2026-08-08T21:45:04Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#purge` (`packages/activerecord/src/tasks/sqlite-database-tasks.ts`)
is not Rails' body. Rails
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:30-37`):

```ruby
def purge
  connection.disconnect!
  drop
rescue NoDatabaseError
ensure
  create
  connection.reconnect!
end
```

trails instead calls two private trails-only helpers, `disconnect()` and
`reconnect()`, each of which swallows every error in a bare `catch {}` ("best
effort"), and `disconnect()` reaches `Base.connectionPool().disconnect()`
rather than `connection.disconnect!`. Rails rescues exactly `NoDatabaseError`
and nothing else, and its `ensure` runs `create` unconditionally.

Two rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/tasks/sqlite-database-tasks.json`
record this: `purge`/`disconnect!` and `purge`/`reconnect!`, both still carrying
the seeded RFC 0047 placeholder reason. They converge by deletion when the body
does.

Surfaced while converging `create` in #6259. Note #6259 already made `create`
establish a connection, so `purge`'s trailing `reconnect()` is now redundant as
well as divergent.

## Converged shape

`purge` is `sqlite_database_tasks.rb:30-37` line for line: `connection`'s
`disconnect!`, `drop`, a `NoDatabaseError`-only rescue, and an `ensure` that
runs `create` then `connection.reconnect!`. The `disconnect()` / `reconnect()`
private helpers and their blanket `catch {}` go with it — Rails extracts
neither.

## Acceptance criteria

- [ ] `purge` matches `sqlite_database_tasks.rb:30-37`: same calls, same order,
      same single-class rescue, same `ensure`.
- [ ] The `disconnect()` and `reconnect()` private helpers are gone; no bare
      `catch {}` swallows a non-`NoDatabaseError` failure.
- [ ] The `purge`/`disconnect!` and `purge`/`reconnect!` rows are deleted from
      `call-mismatches-exclude/activerecord/tasks/sqlite-database-tasks.json`
      (baseline only shrinks; do not reseed) and the per-file unreviewed mark
      tightens with them.
- [ ] Green on the sqlite file lane and `sqlite3_mem`.
