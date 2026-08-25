---
title: "SQLiteDatabaseTasks#create writes an empty file instead of establishing a connection"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6259
claim: "2026-08-08T19:57:19Z"
assignee: "date-state-julian-only-spellings-unbuildable"
blocked-by: null
closed-reason: null
---

## Context

Rails creates the SQLite database by _connecting to it_
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:15-20`):

```ruby
def create
  raise DatabaseAlreadyExists if File.exist?(db_config.database)

  establish_connection
  connection
end
```

Three things there that trails' `SQLiteDatabaseTasks#create`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) does differently:

1. **It never establishes a connection.** trails writes an empty file with
   `fs.mkdirSync` + `fs.writeFileSync` instead. The file SQLite itself would
   create on connect is not byte-identical to a zero-length file (a real SQLite
   database gets a 100-byte header on first write), and nothing leaves the task
   with a live connection the way Rails' trailing bare `connection` does.
2. **`raise DatabaseAlreadyExists` takes no argument in Rails**; trails raises
   `new DatabaseAlreadyExists(\`Database '${dbPath}' already exists\`)`. Rails'
   message comes from the rescue in `DatabaseTasks.create`
   (`tasks/database_tasks.rb`), which prints
   `"Database '#{db_config.database}' already exists"` to `$stderr` — so trails
   is baking the caller's banner into the exception.
3. **It checks `resolveDbPath()`, not `db_config.database`.** Rails' `create`
   checks the raw configured path (only `drop` joins `root`,
   `sqlite_database_tasks.rb:23-24`), so a relative database name is tested
   against the process cwd in Rails and against `DatabaseTasks.root` in trails.

Surfaced while porting `sqlite_rake_test.rb` (PR #6248). This is the root cause
of four of the six unported `SqliteDBCreateTest` stubs in
`packages/activerecord/src/adapters/sqlite3/sqlite-rake.test.ts`, all of which
assert on `establish_connection`:
`test_db_create_with_file_does_nothing` (`sqlite_rake_test.rb:47-53`,
`assert_not_called(ActiveRecord::Base, :establish_connection)`),
`test_db_create_establishes_a_connection` (`:55-62`),
`test_db_checks_database_exists` (`:23-29`) and
`test_db_create_with_error_prints_message` (`:64-69`). None of them can be
written against a task that only touches the filesystem.

## Converged shape

`create` raises bare `DatabaseAlreadyExists` on `File.exist?(db_config.database)`
and otherwise calls `establishConnection()` then `connection()`, letting SQLite
create the file. The in-memory guard needs re-deriving on that shape: Rails has
no in-memory lane, and `File.exist?(":memory:")` is false, so the natural
converged behaviour is simply to connect — which is the correct thing for
`:memory:` anyway.

The banner text moves to (or is confirmed already in) `DatabaseTasks.create`'s
rescue, so the exception carries no message of its own.

## Acceptance criteria

- [ ] `create` matches `sqlite_database_tasks.rb:15-20` line for line:
      `File.exist?` guard on the raw configured database, bare
      `DatabaseAlreadyExists`, `establishConnection()`, `connection()`.
- [ ] No `fs.writeFileSync` stand-in for connecting.
- [ ] `"Database '<x>' already exists"` still reaches stderr for
      `db create` on an existing database (it comes from the caller's rescue,
      not the exception).
- [ ] Green on the sqlite file lane and `sqlite3_mem`.
