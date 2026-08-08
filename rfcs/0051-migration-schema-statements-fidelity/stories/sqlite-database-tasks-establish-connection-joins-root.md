---
title: "SQLiteDatabaseTasks#create guards the raw database but connects through the root-joined resolveDbPath"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 6262
claim: "2026-08-08T20:45:03Z"
assignee: "date-start-argument-and-reform-surface-absent"
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLiteDatabaseTasks#create`
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:15-20`)
reads the _raw_ configured database throughout — `File.exist?(db_config.database)`
guards it and `establish_connection` connects to `db_config` as-is. Only `drop`
joins `root` (`:23-24`):

```ruby
file = File.absolute_path?(db_path) ? db_path : File.join(root, db_path)
```

PR #6259 converged the guard to the raw `this.dbConfig.database`, but left
`establishConnection()`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) routing through the
trails-only `resolveDbPath()`, which joins `DatabaseTasks.root` for a relative
database name and substitutes `":memory:"` for a missing one. So for a relative
`database:` the guard now tests one path (cwd-relative, as Rails does) and the
connect opens another (root-joined) — the two halves of one Rails method
disagreeing about which file they mean.

Absolute paths — every lane trails runs today — are unaffected, which is why it
is invisible in CI.

`resolveDbPath` has no Rails counterpart; `drop`'s `root` join is the only place
Rails does this, and it does it inline.

## Converged shape

`establish_connection` connects to `db_config` unchanged, as
`sqlite_database_tasks.rb:18` does. The `root` join survives only in `drop`,
written inline as `:23-24` writes it, so `resolveDbPath()` disappears rather
than moving. Callers that relied on its `":memory:"` default need re-deriving
against Rails, which has no such default — `db_config.database` is whatever the
configuration says.

## Acceptance criteria

- [ ] `create` guards and connects against the same raw `db_config.database`.
- [ ] The `root` join appears only in `drop`, inline, matching `:23-24`.
- [ ] `resolveDbPath()` is gone, not relocated; no invented `":memory:"`
      substitution survives outside what a Rails cite supports.
- [ ] A regression test pins a _relative_ `database:` — it fails on the
      baseline, where the guard and the connect disagree.
- [ ] Green on the sqlite file lane and `sqlite3_mem`.
