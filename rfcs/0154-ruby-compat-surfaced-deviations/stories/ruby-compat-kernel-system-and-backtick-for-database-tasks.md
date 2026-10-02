---
title: "ruby-compat: Kernel#system and Kernel#backtick so database tasks shell out as Rails does"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' database tasks shell out through two Kernel methods:

- `Kernel.system(cmd, *args, out: out)` in `run_cmd`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:77-79`,
  `mysql_database_tasks.rb:110`, `postgresql_database_tasks.rb:120`).
- A backtick command in `SQLiteDatabaseTasks#structure_load` (`sqlite_database_tasks.rb:60-63`):

```ruby
flags = extra_flags.join(" ") if extra_flags
`sqlite3 #{flags} #{db_config.database} < "#{filename}"`
```

ruby-compat exports neither. The ports call `getChildProcessAsync().spawnSync(...)` and read `.status`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts` `runCmd`, and the same in the MySQL and
PostgreSQL task files). With no shell, `structureLoad` splits the joined `flags` on whitespace itself and
redirects stdin through the adapter's `in:` option (trails#8419).

The story `ruby-compat-kernel-system-and-open3-capture2e` is marked done against trails#8305, but
`packages/ruby-compat/src` has no `system` or `capture2e` export as of 2026-10-02; check what that story
shipped before starting.

## Acceptance criteria

- [ ] ruby-compat ports `Kernel#system` (`vendor/ruby/v3.3.11/process.c` `rb_f_system`: true / false / nil)
      and ``Kernel#` `` (`rb_f_backquote`), async, each with its `@noRailsEquivalent PERMANENT` receipt.
- [ ] The three `run_cmd` ports read `fail run_cmd_error(...) unless Kernel.system(...)`.
- [ ] `SQLiteDatabaseTasks#structureLoad` runs Rails' command string through the backtick port, with no
      flag splitting of its own.
