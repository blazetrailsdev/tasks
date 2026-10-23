---
title: "ruby-compat ports Kernel#` for SQLiteDatabaseTasks#structure_load"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' database tasks shell out through two Kernel methods. The first has
landed: ruby-compat ports `Kernel#system` as `rbFSystem`, and all three
`run_cmd` ports call it (`packages/activerecord/src/tasks/sqlite-database-tasks.ts:112-115`,
`mysql-database-tasks.ts:128-131`, `postgresql-database-tasks.ts:157-160`;
`sqlite_database_tasks.rb:77-79`, `mysql_database_tasks.rb:110`,
`postgresql_database_tasks.rb:120`).

The backtick is still missing. `SQLiteDatabaseTasks#structure_load`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:60-63`) is

```ruby
flags = extra_flags.join(" ") if extra_flags
`sqlite3 #{flags} #{db_config.database} < "#{filename}"`
```

ruby-compat has no ``Kernel#` `` (`rb_f_backquote`, `vendor/ruby/v3.3.11/io.c:10585`),
so the port (`sqlite-database-tasks.ts:95-98`) splits `flags` on whitespace
itself and calls `getChildProcessAsync().spawnSync("sqlite3", args, { in: filename })`
with no shell.

`thor-terminal-dynamic-width-needs-backtick-with-inherited-stdin` needs the
same port (with the caller's stdin inherited, as Ruby's backtick does) and
depends on this story.

## Acceptance criteria

- [ ] ruby-compat ports ``Kernel#` `` (`rb_f_backquote`, `io.c:10585`), async,
      running the command through `/bin/sh` with stdin inherited and stdout
      captured, setting `$?`, with its `@noRailsEquivalent PERMANENT` receipt
      and a `.trails.test.ts`.
- [ ] `SQLiteDatabaseTasks#structureLoad` builds Rails' command string and
      runs it through the port, with no flag splitting or `spawnSync` of its own.
- [ ] The SQLite structure-load tests stay green.
