---
title: "SQLiteDatabaseTasks#establish_connection drops Rails' trailing connection.connect!"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6275
claim: "2026-08-09T02:30:47Z"
assignee: "converge-check-constraint-name-fetch-semantics"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#establish_connection`
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:72-75`):

```ruby
def establish_connection(config = db_config)
  ActiveRecord::Base.establish_connection(config)
  connection.connect!
end
```

trails (`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) makes only
the first call:

```ts
private async establishConnection(config: DatabaseConfig = this.dbConfig): Promise<void> {
  await Base.establishConnection(config.configuration as { adapter?: string; [key: string]: unknown });
}
```

The trailing `connection.connect!` is dropped. Surfaced in PR #6262, which
converged the same method's `root`-joining `resolveDbPath()` away but left the
missing call — out of that story's scope
(`sqlite-database-tasks-establish-connection-joins-root`).

This matters because `establish_connection` alone does not open anything —
`Base.establishConnection` installs a pool lazily. Rails' `connect!` is what
forces the connection open inside `establish_connection`, so a caller that does
not separately lease a connection never opens the database file. `create`
(`:15-20`) happens to mask this by calling a bare `connection` right after, but
`reconnect` (used by `purge`, `:31-37`) does not.

## Converged shape

`establishConnection` ends in the `connect!` call, as `:72-75` writes it. Check
whether `create`'s trailing `await this.connection()` then becomes the redundant
one Rails' bare `connection` at `:19` still is (Rails keeps both), and keep
Rails' shape either way.

## Acceptance criteria

- [ ] `establishConnection` makes both calls, in Rails' order.
- [ ] Any `call-mismatches-exclude` row for `establish_connection` / `connect!`
      is deleted rather than reworded.
- [ ] Green on the sqlite file lane and `sqlite3_mem`.
